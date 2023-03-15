import * as React from 'react';

import moment from 'moment-timezone';
import * as d3 from 'd3';
import MainPageGraph from "../../../common/GraphCommon";
import Slide from '@mui/material/Slide';
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import Fade from '@mui/material/Fade';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import styles from './CalendarHeatmap.css'

class CalendarHeatmap extends React.Component {

  constructor(props) {
    super(props)

    this.settings = {
      gutter: 5,
      item_gutter: 1,
      width: 1000,
      height: 200,
      item_size: 10,
      label_padding: 40,
      max_block_height: 20,
      transition_duration: 500,
      tooltip_width: 250,
      tooltip_padding: 15,
    }

    this.fromClickedDate = false;
    this.in_transition = false
    this.transitionHide = false;
    this.overview = this.props.overview
    this.history = [{ overview: "global", data: {} }]
    this.selected = {}
    this.selectedDay = {}
    this.state = { graphData: null, showGraph: false, loadingGraph: false, fromOnPoint: false, onTransitionHide: false };

    this.calcDimensions = this.calcDimensions.bind(this)
  }

  statusColor = {
    "-1": "#f7584d",
    "0": "#f5ce64",
    "1": "#007500",
    "2": "#808080"
  };

  componentDidMount() {
    this.createElements()
    this.parseData()
    this.drawChart()

    window.addEventListener('resize', this.calcDimensions)
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("Should componente redraw?", prevProps.overview, this.props.overview);
    this.parseData();
    if (prevState === !this.state || prevProps.data !== this.props.data || prevProps.overview !== this.props.overview) {
      if (prevProps.overview !== this.props.overview) {
        this.clearChart();
        this.overview = this.props.overview;
      }
      console.log("Drawing chart");
      this.drawChart();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.calcDimensions)
  }

  createElements() {
    // Create svg element
    this.svg = d3.select('#calendar-heatmap')
      .append('svg')
      .attr('class', 'svg')

    this.labelsHorizontal = d3.select('#time-labels')
      .append('svg')
      .attr('class', 'svg')


    // Create other svg elements
    this.items = this.svg.append('g')
    this.labelsVertical = this.svg.append('g')
    this.labels = this.labelsHorizontal.append('g')
    this.buttons = this.labelsHorizontal.append('g')

    // Add tooltip to the same element as main svg
    this.tooltip = d3.select('#calendar-heatmap')
      .append('div')
      .attr('class', styles.heatmapTooltip)
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('z-index', 9999)
      .style('width', '250px')
      .style('max-width', '250px')
      .style('overflow', 'hidden')
      .style('padding', '15px')
      .style('font-size', '12px')
      .style('line-height', '14px')
      .style('color', 'rgb(51, 51, 51)')
      .style('background', 'rgba(255, 255, 255, 0.75)')
      .style('max-height', '200px')
      .style('overflow-y', 'auto')
      .attr('total', 0)
      .attr('date', moment().unix())
      .on('mouseenter', (event, d) => {
        if (this.state.fromOnPoint) {
          console.log("Mouse Enters tooltip from OnPoint")
          this.tooltip.transition().duration(0);
        }
      })
      .on('mouseleave', (event, d) => {
        if (this.state.fromOnPoint) {
          console.log("Mouse leave tooltip from OnPoint")
          this.hideTooltip("fromTooltip")
        }
      })

    this.calcDimensions()
  }

  // Calculate dimensions based on available width
  calcDimensions() {
    let dayIndex = Math.round((moment() - moment().subtract(1, 'year').startOf('week')) / 86400000)
    let colIndex = Math.trunc(dayIndex / 7)
    let numWeeks = colIndex + 1

    this.settings.width = this.container.offsetWidth < 1000 ? 1000 : this.container.offsetWidth
    this.settings.item_size = ((this.settings.width - this.settings.label_padding) / numWeeks - this.settings.gutter)
    this.settings.height = this.settings.label_padding + 7 * (this.settings.item_size + this.settings.gutter)
    this.settings.height = 340;
    console.log("Height", this.settings.height);
    this.svg.attr('width', this.settings.width)
      .attr('height', this.settings.height)
    this.labelsHorizontal.attr('width', this.settings.width)
      .attr('height', 48)
    if (!!this.props.data && !!this.props.data[0].summary) {
      this.drawChart()
    }
  }

  timeToDate(timestamp) {
    if (timestamp._seconds !== undefined) {
      return new Date(timestamp._seconds * 1000);
    }
    return timestamp;
  }

  parseServers(hoursObj, currentDate) {
    let result = Object.keys(hoursObj).map(key => {
      let unsortedServers = Object.keys(hoursObj[key].servers).map(serverKey => {
        let tempValue = 0;
        let tempMetrics = [];
        if (isNaN(hoursObj[key].servers[serverKey])) {
          tempValue = hoursObj[key].servers[serverKey].total;
          Object.keys(hoursObj[key].servers[serverKey]).forEach((metric) => {
            if (metric !== "total") {
              tempMetrics.push("MetricTag-" + serverKey + ",;" + metric);
            }
          })
        } else {
          tempValue = hoursObj[key].servers[serverKey];
        }
        return {
          'name': serverKey,
          'value': tempValue,
          'metrics': tempMetrics,
        }
      });
      let orderedServers = unsortedServers.sort((a, b) => {
        return b.value - a.value
      });

      return {
        "hour": currentDate.clone().set({ hour: key, minute: 0, second: 0, millisecond: 0 }),
        "details": hoursObj[key].details,
        "servers": orderedServers,
        "total": hoursObj[key].total,
      };
    })
    return result
  }

  parseAnomalyDetails = (data) => {
    console.log("Graph data", data);
    let status = data.status;
    let tempData = {
      datasets: [{
        pointBackgroundColor: [],
        label: data.anomalyType,
        data: [],
        borderColor: '#3e95cd',
        fill: false,
        lineAtIndex: [],
      },
      ]
    };

    for (var i = 0; i < data.one_hour_data.length; i++) {
      let dataRow = { x: moment(data.one_hour_data[i].Date._seconds * 1000), y: data.one_hour_data[i].Value }
      // TODO: All anomalies are getting the same id
      if (data.one_hour_data[i].Anomaly) {
        dataRow["status"] = (status === null ? 2 : status);
        dataRow["id"] = (data.rowKey);
        tempData.datasets[0].lineAtIndex.push(i);
        tempData.datasets[0].pointBackgroundColor.push(this.statusColor[(status === null ? 2 : status)]);
      } else {
        tempData.datasets[0].pointBackgroundColor.push('rgba(106,160,247,0.7)');
      }
      tempData.datasets[0].data.push(dataRow);
    }
    this.setState({ graphData: tempData, showGraph: true, loadingGraph: false, serverName: data.Server_ID });
  }

  queryAnomalyDetails = async (id) => {
    this.setState({ loadingGraph: true })
    await fetch('/anomalyDetails', {
      method: 'POST',
      body: JSON.stringify({
        id: id,
      }),
      headers: {
        'Content-type': 'application/json',
      }
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(text);
          });
        } else {
          return response.json();
        }
      })
      .then((data) => {
        console.log("Anomaly details heatmap", data.result);
        this.parseAnomalyDetails(data.result);
      })
      .catch((err) => {
        this.setState({ loadingGraph: false });
        console.log(err);
        //setError(err);
      })
  }

  parseData() {
    if (!this.props.data) { return }
    // Get daily summary if that was not provided
    if (!this.props.data[0].summary) {
      console.log("Parsing Data");
      this.props.data.map(d => {
        d.date = moment(d.date, "YYYY-MM-DD HH:mm:ss");
        let unsorted_summary = Object.keys(d.servers).map(key => {
          return {
            'name': key,
            'value': d.servers[key]
          }
        })

        d.summary = unsorted_summary.sort((a, b) => {
          return b.value - a.value
        })

        return d
      })
    }
  }

  clearChart() {
    if (this.overview === 'global') {
      this.removeGlobalOverview()
    } else if (this.overview === 'year') {
      this.removeYearOverview()
    } else if (this.overview === 'month') {
      this.removeMonthOverview()
    } else if (this.overview === 'week') {
      this.removeWeekOverview()
    } else if (this.overview === 'day') {
      this.removeDayOverview()
    } else if (this.overview === 'hour') {
      this.removeHourOverview()
    }
  }

  drawChart() {
    if (this.overview === 'global') {
      this.drawGlobalOverview()
    } else if (this.overview === 'year') {
      this.drawYearOverview()
    } else if (this.overview === 'month') {
      this.drawMonthOverview()
    } else if (this.overview === 'week') {
      this.drawWeekOverview()
    } else if (this.overview === 'day') {
      this.drawDayOverview()
    } else if (this.overview === 'hour') {
      this.drawHourOverview()
    }
  }

  formatAnomalyTxt(anomalies) {
    if (anomalies > 1) {
      return anomalies + " anomalies";
    } else {
      return anomalies + " anomaly";
    }
  }

  /**
   * Draw global overview (multiple years)
   * It will remain unactive for the time being
   */
  drawGlobalOverview() {
    // Add current overview to the history
    if (this.history[this.history.length - 1].overview !== this.overview) {
      this.history.push({ overview: this.overview, data: this.selected });
    }

    // Define start and end of the dataset
    let start = moment(this.timeToDate(this.props.data[0].date)).startOf('year')
    let end = moment(this.timeToDate(this.props.data[this.props.data.length - 1].date)).endOf('year')

    // Define array of years and total values
    let year_data = d3.timeYears(start, end).map(d => {
      let date = moment(d)
      let getSummary = () => {
        let summary = this.props.data.reduce((summary, d) => {
          if (moment(this.timeToDate(d.date)).year() === date.year()) {
            d.summary.forEach(item => {
              if (!summary[item.name]) {
                summary[item.name] = {
                  'value': item.value,
                }
              } else {
                summary[item.name].value += item.value
              }
            })
          }
          return summary
        }, {})
        let unsorted_summary = Object.keys(summary).map(key => {
          return {
            'name': key,
            'value': summary[key].value
          }
        })
        return unsorted_summary.sort((a, b) => {
          return b.value - a.value
        })
      }
      return {
        'date': date,
        'total': this.props.data.reduce((prev, current) => {
          if (moment(this.timeToDate(current.date)).year() === date.year()) {
            prev += current.total
          }
          return prev
        }, 0),
        'summary': getSummary(),
      }
    })

    // Calculate max value of all the years in the dataset
    let max_value = d3.max(year_data, d => {
      return d.total
    })

    // Define year labels and axis
    let year_labels = d3.timeYears(start, end).map(d => {
      return moment(d)
    })
    let yearScale = d3.scaleBand()
      .rangeRound([0, this.settings.width])
      .padding([0.05])
      .domain(year_labels.map(d => {
        return d.year()
      }))

    // Add global data items to the overview
    this.items.selectAll('.item-block-year').remove()
    this.items.selectAll('.item-block-year')
      .data(year_data)
      .enter()
      .append('rect')
      .attr('class', 'item item-block-year')
      .style('cursor', 'pointer')
      .attr('width', () => {
        return (this.settings.width - this.settings.label_padding) / year_labels.length - this.settings.gutter * 5
      })
      .attr('height', () => {
        return this.settings.height - this.settings.label_padding
      })
      .attr('transform', d => {
        return 'translate(' + yearScale(d.date.year()) + ',' + this.settings.tooltip_padding * 2 + ')'
      })
      .attr('fill', d => {
        let color = d3.scaleLinear()
          .range(['#ffffff', this.props.color])
          .domain([-0.15 * max_value, max_value])
        return color(d.total) || '#ff4500'
      })
      .on('click', (event, d) => {
        if (this.in_transition) { return }

        // Set in_transition flag
        this.in_transition = true

        // Set selected date to the one clicked on
        this.selected = { date: d.date }

        // Hide tooltip
        this.hideTooltip()

        // Remove all global overview related items and labels
        this.removeGlobalOverview()

        // Redraw the chart
        this.overview = 'year'
        this.drawChart()
      })
      .style('opacity', 0)
      .on('mouseover', (event, d) => {
        if (this.in_transition) { return }

        // Construct tooltip
        let tooltip_html = ''
        tooltip_html += '<div><span><strong>Anomalies detected: ' + d.total + '</strong></span><br /><br />'

        // Add summary to the tooltip
        if (d.summary.length <= 5) {
          let counter = 0
          while (counter < d.summary.length) {
            tooltip_html += '<div><span><strong>' + d.summary[counter].name + ':</strong></span>'
            tooltip_html += '<span> ' + this.formatAnomalyTxt(d.summary[counter].value) + '</span></div>'
            counter++
          }
        } else {
          let counter = 0
          while (counter < 5) {
            tooltip_html += '<div><span><strong>' + d.summary[counter].name + ':</strong></span>'
            tooltip_html += '<span> ' + this.formatAnomalyTxt(d.summary[counter].value) + '</span></div>'
            counter++
          }

          tooltip_html += '<br />'

          counter = 5
          let other_projects_sum = 0
          while (counter < d.summary.length) {
            other_projects_sum = +d.summary[counter].value
            counter++
          }
          tooltip_html += '<div><span><strong>Other: </strong></span>'
          tooltip_html += '<span>' + this.formatAnomalyTxt(other_projects_sum) + '</span></div>'
        }

        let x = 600
        let y = 150
        // Show tooltip
        this.tooltip.html(tooltip_html)
          .style('left', x + 'px')
          .style('top', y + 'px')
          .transition()
          .duration(this.settings.transition_duration / 2)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }
        this.hideTooltip()
      })
      .transition()
      .delay((d, i) => {
        return this.settings.transition_duration * (i + 1) / 10
      })
      .duration(() => {
        return this.settings.transition_duration
      })
      .ease(d3.easeLinear)
      .style('opacity', 1)
      .call((transition, callback) => {
        if (transition.empty()) {
          callback()
        }
        let n = 0
        transition
          .each(() => { ++n })
          .on('end', function () {
            if (!--n) {
              callback.apply(this, arguments)
            }
          })
      }, () => {
        this.in_transition = false
      })

    // Add year labels
    this.labels.selectAll('.label-year').remove()
    this.labels.selectAll('.label-year')
      .data(year_labels)
      .enter()
      .append('text')
      .attr('class', 'label label-year')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return d.year()
      })
      .attr('x', d => {
        return yearScale(d.year())
      })
      .attr('y', this.settings.label_padding / 2)
      .on('mouseenter', (event, year_label) => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-year')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', d => {
            return (moment(d.date).year() === year_label.year()) ? 1 : 0.1
          })
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-year')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })
      .on('click', (event, d) => {
        if (this.in_transition) { return }

        // Set in_transition flag
        this.in_transition = true

        // Set selected year to the one clicked on
        this.selected = { date: d }

        // Hide tooltip
        this.hideTooltip()

        // Remove all global overview related items and labels
        this.removeGlobalOverview()

        // Redraw the chart
        this.overview = 'year'
        this.drawChart()
      })
  }


  /**
   * Draw year overview
   */
  drawYearOverview() {
    // Add current overview to the history
    this.fromClickedDate = false;
    if (this.history[this.history.length - 1].overview !== this.overview) {
      this.history.push({ overview: this.overview, data: { ...this.selected } })
    }

    // Filter data down to the selected year
    // let tempStartUtc = start_of_year.clone().utc();
    // let tempEndUtc = end_of_year.clone().utc();
    // console.log("Start and end utc", tempStartUtc.format("LLL"), tempEndUtc.format("LLL"));
    let year_data = [...this.props.data];
    // Define start and end date of the selected year (in this version we will only show the current year)
    let start_of_year = year_data[0].date.clone().startOf('year');
    let end_of_year = year_data[0].date.clone().endOf('year');
    // this.props.data.forEach((d) => {
    //   let entry = d;
    //   console.log("Day", entry);
    //   let tempDate = entry.date.clone();
    //   if ((tempDate.isAfter(tempStartUtc) || tempDate.isSame(tempStartUtc)) && tempDate.isBefore(tempEndUtc)) {
    //     entry.date = tempDate;
    //     year_data.push(entry);
    //   }
    // })

    // Calculate max value of the year data
    let max_value = d3.max(year_data, d => d.total)

    let color = d3.scaleLinear()
      .range(['#ffffff', this.props.color])
      .domain([-0.15 * max_value, max_value])

    let calcItemX = (d) => {
      let date = d.date.clone();
      let dayIndex = Math.round((date - start_of_year.startOf('week')) / 86400000)
      let colIndex = Math.trunc(dayIndex / 7)
      return colIndex * (this.settings.item_size + this.settings.gutter) + this.settings.label_padding
    }

    let calcItemSize = d => {
      if (max_value <= 0) {
        return this.settings.item_size
      }
      // console.log("Item size", this.settings.item_size * 0.75);
      return this.settings.item_size * 0.75;
    }

    let day_labels = d3.timeDays(moment().startOf('week'), moment().endOf('week'))
    let dayScale = d3.scaleBand()
      .rangeRound([0, this.settings.height])
      .domain(day_labels.map(d => {
        return moment(d).weekday()
      }))

    this.items.selectAll('.item-circle').remove()
    this.items.selectAll('.item-circle')
      .data(year_data)
      .enter()
      .append('rect')
      .attr('class', 'item item-circle')
      .style('cursor', 'pointer')
      .style('opacity', 0)
      .attr('x', d => {
        // console.log("Attribute x", (calcItemX(d) + (this.settings.item_size - calcItemSize(d)) / 2));
        // console.log("X date", d.date.format('LLLL'));
        // console.log("X", calcItemX(d) + (this.settings.item_size - calcItemSize(d)) / 2);
        return calcItemX(d) + (this.settings.item_size - calcItemSize(d)) / 2;
      })
      .attr('y', d => {
        // console.log("Day and Coor Y dot", d.date.clone().format('LLL'), dayScale(d.date.clone().weekday()) + (dayScale.bandwidth() / 1.75) - (this.settings.item_size - calcItemSize(d) / 2));
        // console.log("Weekday", d.date.clone().weekday());
        // console.log("Coor point", d.date.clone().local().weekday(), dayScale(d.date.clone().local().weekday()) + dayScale.bandwidth() / 1.75);
        return dayScale(d.date.clone().weekday()) + (dayScale.bandwidth() / 1.75) - (this.settings.item_size - calcItemSize(d) / 2);
        // return dayScale(d.date.clone().local().weekday()) + dayScale.bandwidth() / 1.75;
      })
      .attr('rx', d => {
        return calcItemSize(d)
      })
      .attr('ry', d => {
        return calcItemSize(d)
      })
      .attr('width', d => {
        return calcItemSize(d)
      })
      .attr('height', d => {
        return calcItemSize(d)
      })
      .attr('fill', d => {
        return (d.total > 0) ? color(d.total) : 'transparent'
      })
      .on('click', (event, d) => {
        if (this.in_transition) { return }

        // Don't transition if there is no data to show
        if (d.total === 0) { return }

        this.in_transition = true

        // Set selected date to the one clicked on
        this.selected = d

        // Hide tooltip
        this.hideTooltip()

        // Remove all year overview related items and labels
        this.removeYearOverview()

        // Redraw the chart
        this.fromClickedDate = true;
        this.overview = 'day'
        this.drawChart()
      })
      .on('mouseenter', (event, d) => {
        if (this.in_transition) { return }

        // Pulsating animation
        console.log("Something")
        let circle = d3.select(event.currentTarget)
        let repeat = () => {
          circle = circle.transition()
            .duration(this.settings.transition_duration)
            .ease(d3.easeLinear)
            .attr('x', d => {
              return calcItemX(d) - (this.settings.item_size * 1.1 - this.settings.item_size) / 2
            })
            .attr('width', this.settings.item_size * 1.1)
            .attr('height', this.settings.item_size * 1.1)
        }
        repeat()

        this.setState({ fromOnPoint: true });
        let transitionDate = parseInt(this.tooltip.attr('date'));
        let transitionTotal = parseInt(this.tooltip.attr('total'))

        if (this.transitionHide && transitionDate === d.date.clone().unix() && d.total === transitionTotal) {
          this.tooltip.transition().duration(0);
          return;
        }

        // Construct tooltip
        // console.log("Tooltip Creation");
        let tooltip_html = ''
        tooltip_html += `<div class="${styles.header}"><strong>${d.total ? this.formatAnomalyTxt(d.total) : 'No anomalies'} tracked</strong></div>`
        tooltip_html += '<div>on ' + d.date.clone().format('dddd, MMM Do YYYY') + '</div><br>';

        // Add summary to the tooltip
        let counter = 0
        while (counter < d.summary.length) {
          tooltip_html += '<div><span><strong>' + d.summary[counter].name + '</strong></span>'
          tooltip_html += '<span> ' + this.formatAnomalyTxt(d.summary[counter].value) + '</span></div>'
          counter++
        }

        // Calculate tooltip position
        let x = event.pageX;
        let clientX = event.clientX;
        if (event.view.outerWidth - clientX < (this.settings.tooltip_width + 50)) {
          x = x - ((this.settings.tooltip_width + 50) - (event.view.outerWidth - clientX));
        }
        let y = event.pageY;

        // Show tooltip
        this.tooltip.html(tooltip_html)
          .style('left', x + 'px')
          .style('top', y + 'px')
          .style('opacity', 1)
          .attr('total', d.total)
          .attr('date', d.date.clone().unix())
          .transition()
          .duration(0)
          .ease(d3.easeLinear)
      })
      .on('mouseleave', (event, d) => {
        if (this.in_transition) { return }

        // Set circle radius back to what its supposed to be
        d3.select(event.currentTarget).transition()
          .duration(this.settings.transition_duration / 2)
          .ease(d3.easeLinear)
          .attr('x', d => {
            return calcItemX(d) + (this.settings.item_size - calcItemSize(d)) / 2
          })
          .attr('width', d => {
            return calcItemSize(d)
          })
          .attr('height', d => {
            return calcItemSize(d)
          })

        this.tooltip.style('pointer-events', 'auto');
        this.hideTooltip('temp')

      })
      .transition()
      .delay(() => {
        return (Math.cos(Math.PI * Math.random()) + 1) * this.settings.transition_duration
      })
      .duration(() => {
        return this.settings.transition_duration
      })
      .ease(d3.easeLinear)
      .style('opacity', 1)
      .call((transition, callback) => {
        if (transition.empty()) {
          callback()
        }
        let n = 0
        transition
          .each(() => ++n)
          .on('end', function () {
            if (!--n) {
              callback.apply(this, arguments)
            }
          })
      }, () => {
        this.in_transition = false
      })

    // Add month labels
    let month_labels = d3.timeMonths(start_of_year, end_of_year)
    let monthScale = d3.scaleLinear()
      .range([0, this.settings.width])
      .domain([0, month_labels.length])
    this.labels.selectAll('.label-month').remove()
    this.labels.selectAll('.label-month')
      .data(month_labels)
      .enter()
      .append('text')
      .attr('class', 'label label-month')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return d.toLocaleDateString('en-us', { month: 'short' })
      })
      .attr('x', (d, i) => {
        return monthScale(i) + (monthScale(i) - monthScale(i - 1)) / 2
      })
      .attr('y', this.settings.label_padding / 2)
      .on('mouseenter', (event, d) => {
        if (this.in_transition) { return }

        let selected_month = moment(d)
        this.items.selectAll('.item-circle')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', d => {
            return moment(d.date).isSame(selected_month, 'month') ? 1 : 0.1
          })
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-circle')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })
      .on('click', (event, d) => {
        if (this.in_transition) { return }

        // Check month data
        let month_data = this.props.data.filter(e => {
          return (e.date.clone().isAfter(moment(d).startOf('month')) || e.date.clone().isSame(moment(d).startOf('month'))) && (e.date.clone().isBefore(moment(d).endOf('month')) || e.date.clone().isSame(moment(d).endOf('month')))
        })

        // Don't transition if there is no data to show
        if (!month_data.length) { return }

        // Set selected month to the one clicked on
        this.selected = { date: moment(d) }

        this.in_transition = true

        // Hide tooltip
        this.hideTooltip()

        // Remove all year overview related items and labels
        this.removeYearOverview()

        // Redraw the chart
        this.fromClickedDate = true;
        this.overview = 'month'
        this.drawChart()
      })

    // Add day labels
    this.labelsVertical.selectAll('.label-day').remove()
    this.labelsVertical.selectAll('.label-day')
      .data(day_labels)
      .enter()
      .append('text')
      .attr('class', 'label label-day')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('x', this.settings.label_padding / 3)
      .attr('y', (d, i) => {
        // console.log("Day and label's Y", i, dayScale(i) + dayScale.bandwidth() / 1.75);
        // console.log("Day Scale", dayScale(i));
        return dayScale(i) + dayScale.bandwidth() / 1.75
        // return dayScale(i) + dayScale.bandwidth() / 1.75;
      })
      .style('text-anchor', 'left')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return moment(d).format('dddd')[0]
      })
      .on('mouseenter', (event, d) => {
        if (this.in_transition) { return }

        let selected_day = moment(d)
        this.items.selectAll('.item-circle')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', d => {
            return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1
          })
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-circle')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })

    // Add button to switch back to previous overview
    if (this.history[this.history.length - 2].overview !== "global") {
      this.drawButton()
    }
  }


  /**
   * Draw month overview
   */
  drawMonthOverview() {

    console.log("Drawing month");
    // Add current overview to the history
    // if (this.history[this.history.length - 1].overview !== this.overview) {
    //   this.history.push({ overview: this.overview, data: { ...this.selected } })
    // }
    this.history.push({ overview: this.overview, data: { ...this.selected } })

    // Define beginning and end of the month}
    console.log("This selected", this.selected);
    console.log("History", this.history);
    let start_of_month;
    let end_of_month;
    if (this.props.overview === "month") {
      console.log("This month?")
      start_of_month = moment().startOf('month');
      end_of_month = moment().endOf('month');
      if (this.selected.date !== undefined) {
        console.log("Chcecking if user selected this month", this.selected.date.clone().startOf('month').isSame(start_of_month), this.history[this.history.length - 2].overview && this.fromClickedDate);
        if (!this.selected.date.clone().startOf('month').isSame(start_of_month) && this.history[this.history.length - 2].overview !== "month") {
          start_of_month = this.selected.date.clone().startOf('month');
          end_of_month = this.selected.date.clone().endOf('month');
        } else {
          this.history[this.history.length - 1].data.date = start_of_month.clone();
        }
      }
    } else {
      start_of_month = this.selected.date.clone().startOf('month');
      end_of_month = this.selected.date.clone().endOf('month');
    }

    this.fromClickedDate = false;

    console.log("Friday date, from month", this.props.data[24].date.clone().format('LLLL'));

    // Filter data down to the selected month
    let month_data = this.props.data.filter(d => {
      return (d.date.clone().isAfter(start_of_month) || d.date.clone().isSame(start_of_month)) && (d.date.clone().isBefore(end_of_month) || d.date.clone().isSame(end_of_month))
    })

    console.log("Month data", month_data);

    let max_value = d3.max(month_data, d => {
      return d.total
    })

    // Define day labels and axis
    let day_labels = d3.timeDays(moment().startOf('week'), moment().endOf('week'))
    let dayScale = d3.scaleBand()
      .rangeRound([0, this.settings.height])
      .domain(day_labels.map(d => {
        return moment(d).weekday()
      }))

    // Define week labels and axis
    let week_labels = [start_of_month.clone()]
    while (start_of_month.week() !== end_of_month.week()) {
      let tempWeek = start_of_month.add(1, 'week').clone();
      week_labels.push(tempWeek)
    }

    let weekScale = d3.scaleBand()
      .rangeRound([this.settings.label_padding, this.settings.width])
      .padding([0.05])
      .domain(week_labels.map(weekday => {
        return weekday.week()
      }))

    // Add month data items to the overview
    this.items.selectAll('.item-block-month').remove()
    this.items.selectAll('.item-block-month')
      .data(month_data)
      .enter()
      .append('rect')
      .attr('class', 'item item-block-month')
      .style('cursor', 'pointer')
      .attr('x', function (d) {
        return weekScale(d.date.clone().week());
      })
      .attr('y', function (d) {
        return ((dayScale(d.date.clone().weekday()) + dayScale.bandwidth() / 1.75) - 15);
      })
      .attr('width', () => {
        return (this.settings.width - this.settings.label_padding) / week_labels.length - this.settings.gutter * 5
      })
      .attr('height', () => {
        return Math.min(dayScale.bandwidth(), this.settings.max_block_height)
      })
      // .attr('transform', d => {
      //   return 'translate(' + weekScale(moment(d.date).week()) + ',' + ((dayScale(moment(d.date).weekday()) + dayScale.bandwidth() / 1.75) - 15) + ')'
      // })
      .attr('fill', d => {
        let color = d3.scaleLinear()
          .range(['#ffffff', this.props.color])
          .domain([-0.15 * max_value, max_value])
        return color(d.total) || '#ff4500'
      })
      .style('opacity', 0)
      .on('click', (event, d) => {
        if (this.in_transition) { return }

        // Don't transition if there is no data to show
        if (d.total === 0) { return }

        this.in_transition = true

        // Set selected date to the one clicked on
        console.log("Friday date, from month on clicked day", this.props.data[24].date.clone().format('LLLL'));
        this.selected = { ...d }

        // Hide tooltip
        this.hideTooltip()

        // Remove all month overview related items and labels
        this.removeMonthOverview()

        // Redraw the chart
        this.fromClickedDate = true;
        this.overview = 'day'
        this.drawChart()
      })
      .on('mouseenter', (event, d) => {
        if (this.in_transition) { return }

        this.setState({ fromOnPoint: true });
        let transitionDate = parseInt(this.tooltip.attr('date'));
        let transitionTotal = parseInt(this.tooltip.attr('total'))

        if (this.transitionHide && transitionDate === d.date.clone().unix() && d.total === transitionTotal) {
          this.tooltip.transition().duration(0);
          return;
        }

        // Construct tooltip
        let tooltip_html = ''
        tooltip_html += `<div class="${styles.header}"><strong>${d.total ? this.formatAnomalyTxt(d.total) : 'No anomalies'} tracked</strong></div>`
        tooltip_html += '<div>on ' + d.date.clone().format('dddd, MMM Do YYYY') + '</div><br>';

        // Add summary to the tooltip
        let counter = 0
        while (counter < d.summary.length) {
          tooltip_html += '<div><span><strong>' + d.summary[counter].name + '</strong></span>'
          tooltip_html += '<span> ' + this.formatAnomalyTxt(d.summary[counter].value) + '</span></div>'
          counter++
        }

        // Calculate tooltip position
        let x = event.pageX;
        let clientX = event.clientX;
        if (event.view.outerWidth - clientX < (this.settings.tooltip_width + 50)) {
          x = x - ((this.settings.tooltip_width + 50) - (event.view.outerWidth - clientX));
        }
        let y = event.pageY;

        // Show tooltip
        this.tooltip.html(tooltip_html)
          .style('left', x + 'px')
          .style('top', y + 'px')
          .style('opacity', 1)
          .style('pointer-events', 'auto')
          .attr('total', d.total)
          .attr('date', d.date.clone().unix())
          .transition()
          .duration(0)
          .ease(d3.easeLinear)
      })
      .on('mouseleave', (event, d) => {
        if (this.in_transition) { return }

        this.tooltip.style('pointer-events', 'auto');
        this.hideTooltip('temp');
      })
      .transition()
      .delay(() => {
        return (Math.cos(Math.PI * Math.random()) + 1) * this.settings.transition_duration
      })
      .duration(() => {
        return this.settings.transition_duration
      })
      .ease(d3.easeLinear)
      .style('opacity', 1)
      .call((transition, callback) => {
        if (transition.empty()) {
          callback()
        }
        let n = 0
        transition
          .each(() => ++n)
          .on('end', function () {
            if (!--n) {
              callback.apply(this, arguments)
            }
          })
      }, () => {
        this.in_transition = false
      })

    // Add week labels
    this.labels.selectAll('.label-week').remove()
    this.labels.selectAll('.label-week')
      .data(week_labels)
      .enter()
      .append('text')
      .attr('class', 'label label-week')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return 'Week ' + d.week()
      })
      .attr('x', d => {
        return weekScale(d.week())
      })
      .attr('y', this.settings.label_padding / 2)
      .on('mouseenter', (event, weekday) => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-month')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', d => {
            return (moment(d.date).week() === weekday.week()) ? 1 : 0.1
          })
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-month')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })
      .on('click', (event, d) => {
        if (this.in_transition) { return }

        // Check week data
        console.log("Friday date, from month on clicked week before filter", this.props.data[24].date.clone().format('LLLL'));

        let week_data = this.props.data.filter(e => {
          return (e.date.clone().isAfter(d.clone().startOf('week')) || e.date.clone().isSame(d.clone().startOf('week'))) && (e.date.clone().isBefore(d.clone().endOf('week')) || e.date.clone().isSame(d.clone().endOf('week')))
        })

        // Don't transition if there is no data to show
        if (!week_data.length) { return }

        console.log("Friday date, from month on clicked week after filter", this.props.data[24].date.clone().format('LLLL'));

        this.in_transition = true

        // Set selected month to the one clicked on
        console.log("D before using it for this.selected.date", d, d.format('LLLL'));
        this.selected.date = d.clone();

        console.log("Friday date, from month on clicked week after cloning", this.props.data[24].date.clone().format('LLLL'));

        // Hide tooltip
        this.hideTooltip()

        // Remove all year overview related items and labels
        this.removeMonthOverview()

        // Redraw the chart
        this.fromClickedDate = true;
        this.overview = 'week'
        this.drawChart()
      })

    // Add day labels
    this.labelsVertical.selectAll('.label-day').remove()
    this.labelsVertical.selectAll('.label-day')
      .data(day_labels)
      .enter()
      .append('text')
      .attr('class', 'label label-day')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('x', this.settings.label_padding / 3)
      .attr('y', (d, i) => {
        return dayScale(i) + dayScale.bandwidth() / 1.75
      })
      .style('text-anchor', 'left')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return moment(d).format('dddd')[0]
      })
      .on('mouseenter', (event, d) => {
        if (this.in_transition) { return }

        let selected_day = moment(d)
        this.items.selectAll('.item-block-month')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', d => {
            return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1
          })
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-month')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })

    // Add button to switch back to previous overview
    this.drawButton()
  }


  /**
   * Draw week overview
   */
  drawWeekOverview() {
    // Add current overview to the history
    // if (this.history[this.history.length - 1].overview !== this.overview) {
    //   this.history.push({ overview: this.overview, data: { ...this.selected } })
    // }

    this.history.push({ overview: this.overview, data: { ...this.selected } })

    // Define beginning and end of the week
    let start_of_week;
    let end_of_week;
    console.log("This selected from WEEK", this.selected);
    if (this.props.overview === "week") {
      start_of_week = moment().startOf('week');
      end_of_week = moment().endOf('week');
      if (this.selected.date !== undefined) {
        if (!this.selected.date.clone().startOf('week').isSame(start_of_week) && this.history[this.history.length - 2].overview !== "week" && this.fromClickedDate) {
          start_of_week = this.selected.date.clone().startOf('week');
          end_of_week = this.selected.date.clone().endOf('week');
        } else {
          this.history[this.history.length - 1].data.date = start_of_week.clone();
        }
      }
    } else {
      start_of_week = this.selected.date.clone().startOf('week');
      end_of_week = this.selected.date.clone().endOf('week');
    }
    this.fromClickedDate = false;

    // Filter data down to the selected week
    let week_data = []

    console.log("Friday date, from week", this.props.data[24].date.clone().format('LLLL'));

    this.props.data.forEach((d) => {
      let tempDate = d.date.clone()
      if ((tempDate.isSame(start_of_week) || tempDate.isAfter(start_of_week)) && (tempDate.isBefore(end_of_week) || tempDate.isSame(end_of_week))) {
        week_data.push(d);
      }
    })

    console.log("Week data", week_data);

    let max_value = d3.max(week_data, d => {
      return d.total;
    })

    // Define day labels and axis
    let day_labels = d3.timeDays(moment().startOf('week'), moment().endOf('week'))
    let dayScale = d3.scaleBand()
      .rangeRound([0, this.settings.height])
      .domain(day_labels.map(d => {
        return moment(d).weekday()
      }))

    // Define week labels and axis
    let week_labels = [start_of_week]
    let weekScale = d3.scaleBand()
      .rangeRound([this.settings.label_padding, this.settings.width])
      .padding([0.01])
      .domain(week_labels.map(weekday => {
        return weekday.week()
      }))

    // Add week data items to the overview
    this.items.selectAll('.item-block-week').remove()
    this.items.selectAll('.item-block-week')
      .data(week_data)
      .enter()
      .append('rect')
      .attr('class', 'item item-block-week')
      .style('cursor', 'pointer')
      .attr('x', function (d) {
        return weekScale(d.date.week());
      })
      .attr('y', function (d) {
        return ((dayScale(moment(d.date).weekday()) + dayScale.bandwidth() / 1.75) - 15);
      })
      .attr('width', () => {
        return (this.settings.width - this.settings.label_padding) / week_labels.length - this.settings.gutter * 5
      })
      .attr('height', () => {
        return Math.min(dayScale.bandwidth(), this.settings.max_block_height)
      })
      .attr('fill', d => {
        let color = d3.scaleLinear()
          .range(['#ffffff', this.props.color])
          .domain([-0.15 * max_value, max_value])
        return color(d.total) || '#ff4500'
      })
      .style('opacity', 0)
      // .attr('transform', d => {
      //   return 'translate(' + weekScale(moment(d.date).week()) + ',' + ((dayScale(moment(d.date).weekday()) + dayScale.bandwidth() / 1.75) - 15) + ')'
      // })
      .on('click', (event, d) => {
        if (this.in_transition) { return }

        // Don't transition if there is no data to show
        if (d.total === 0) { return }

        this.in_transition = true

        // Set selected date to the one clicked on
        this.selected = d

        // Hide tooltip
        this.hideTooltip()

        // Remove all week overview related items and labels
        this.removeWeekOverview()

        // Redraw the chart
        this.fromClickedDate = true;
        this.overview = 'day'
        this.drawChart()
      })
      .on('mouseenter', (event, d) => {
        if (this.in_transition) { return }

        this.setState({ fromOnPoint: true });

        let transitionDate = parseInt(this.tooltip.attr('date'));
        let transitionTotal = parseInt(this.tooltip.attr('total'))

        if (this.transitionHide && transitionDate === d.date.unix() && d.total === transitionTotal) {
          this.tooltip.transition().duration(0);
          return;
        }

        // Construct tooltip
        let tooltip_html = ''
        tooltip_html += `<div class="${styles.header}"><strong>${d.total ? this.formatAnomalyTxt(d.total) : 'No anomalies'} tracked</strong></div>`
        tooltip_html += '<div>on ' + d.date.format('dddd, MMM Do YYYY') + '</div><br>';

        // Add summary to the tooltip
        let counter = 0
        while (counter < d.summary.length) {
          tooltip_html += '<div><span><strong>' + d.summary[counter].name + '</strong></span>'
          tooltip_html += '<span> ' + this.formatAnomalyTxt(d.summary[counter].value) + '</span></div>'
          counter++
        }

        // Calculate tooltip position
        let x = event.pageX;
        let clientX = event.clientX;
        if (event.view.outerWidth - clientX < (this.settings.tooltip_width + 50)) {
          x = x - ((this.settings.tooltip_width + 50) - (event.view.outerWidth - clientX));
        }
        let y = event.pageY;

        // Show tooltip
        this.tooltip.html(tooltip_html)
          .style('left', x + 'px')
          .style('top', y + 'px')
          .style('pointer-events', 'auto')
          .style('opacity', 1)
          .attr('date', d.date.clone().unix())
          .attr('total', d.total)
          .transition()
          .duration(0)
          .ease(d3.easeLinear)
      })
      .on('mouseleave', () => {
        if (this.in_transition) { return }
        this.tooltip.style('pointer-events', 'auto');
        this.hideTooltip('temp')
      })
      .transition()
      .delay(() => {
        return (Math.cos(Math.PI * Math.random()) + 1) * this.settings.transition_duration
      })
      .duration(() => {
        return this.settings.transition_duration
      })
      .ease(d3.easeLinear)
      .style('opacity', 1)
      .call((transition, callback) => {
        if (transition.empty()) {
          callback()
        }
        let n = 0
        transition
          .each(() => ++n)
          .on('end', function () {
            if (!--n) {
              callback.apply(this, arguments)
            }
          })
      }, () => {
        this.in_transition = false
      })

    // Add week labels
    this.labels.selectAll('.label-week').remove()
    this.labels.selectAll('.label-week')
      .data(week_labels)
      .enter()
      .append('text')
      .attr('class', 'label label-week')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return 'Week ' + d.week()
      })
      .attr('x', d => {
        return weekScale(d.week())
      })
      .attr('y', this.settings.label_padding / 2)
      .on('mouseenter', (event, weekday) => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-week')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', d => {
            return (moment(d.date).week() === weekday.week()) ? 1 : 0.1
          })
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-week')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })

    // Add day labels
    this.labelsVertical.selectAll('.label-day').remove()
    this.labelsVertical.selectAll('.label-day')
      .data(day_labels)
      .enter()
      .append('text')
      .attr('class', 'label label-day')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('x', this.settings.label_padding / 3)
      .attr('y', (d, i) => {
        return dayScale(i) + dayScale.bandwidth() / 1.75
      })
      .style('text-anchor', 'left')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return moment(d).format('dddd')[0]
      })
      .on('mouseenter', (event, d) => {
        if (this.in_transition) { return }

        let selected_day = moment(d)
        this.items.selectAll('.item-block-week')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', d => {
            return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1
          })
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-week')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })

    // Add button to switch back to previous overview
    this.drawButton()
  }


  /**
   * Draw day overview
   */
  drawDayOverview() {
    // Add current overview to the history
    // if (this.history[this.history.length - 1].overview !== this.overview) {
    //   this.history.push({ overview: this.overview, data: { ...this.selected } })
    // }

    this.history.push({ overview: this.overview, data: { ...this.selected } })

    // Initialize selected date to today if it was not set
    if (!Object.keys(this.selected).length) {
      console.log("setting this.selected");
      this.selected = this.props.data[this.props.data.length - 1]
    }

    this.selectedDay = this.selected;
    console.log("This selected from DAY", this.selected);
    let hoursInputs = [];
    let selectedDay;
    if (this.props.overview === "day") {
      selectedDay = moment().startOf('day');
      if (this.selected.date !== undefined) {
        if (!this.selected.date.isSame(selectedDay) && this.history[this.history.length - 2].overview !== "day" && this.fromClickedDate) {
          selectedDay = this.selected.date.clone();
          hoursInputs = this.parseServers({ ...this.selected.dayData }, selectedDay);
        } else {
          let tempDay = { ...this.props.data[this.props.data.length - 1] };
          if (tempDay.date.isSame(selectedDay)) {
            this.selected = { ...this.props.data[this.props.data.length - 1] };
            this.history[this.history.length - 1].data = { ...this.props.data[this.props.data.length - 1] };;
            hoursInputs = this.parseServers({ ...this.selected.dayData }, selectedDay);
          } else {
            this.selected = { date: moment().startOf('day') };
            this.history[this.history.length - 1].data =
            {
              date: moment().startOf('day'),
              dayData: {},
              servers: {},
              summary: [],
              total: 0,
              total_negative: 0,
              total_no_feedback: 0,
              total_positive: 0,
              total_snoozed: 0
            };
          }
        }
      } else {
        this.selected = { ...this.props.data[this.props.data.length - 1] };
        console.log("This Day?", this.selected);
        if (this.selected.date.isSame(selectedDay)) {
          hoursInputs = this.parseServers({ ...this.selected.dayData }, selectedDay);
          this.history[this.history.length - 1].data = { ...this.props.data[this.props.data.length - 1] };
        } else {
          this.selected = { date: moment().startOf('day') };
          this.history[this.history.length - 1].data =
            {
              date: moment().startOf('day'),
              dayData: {},
              servers: {},
              summary: [],
              total: 0,
              total_negative: 0,
              total_no_feedback: 0,
              total_positive: 0,
              total_snoozed: 0
            };
        }
      }
    } else {
      selectedDay = this.selected.date.clone();
      hoursInputs = this.parseServers({ ...this.selected.dayData }, selectedDay);
    }

    this.fromClickedDate = false;

    let max_value = d3.max(hoursInputs, d => {
      return d.total;
    })

    let project_labels = [this.selected.date.clone().format('dddd')];

    let projectScale = d3.scaleBand()
      .rangeRound([0, this.settings.height])
      .domain(project_labels)


    let startHour = this.selected.date.clone().startOf('day');

    let timeLabels = [startHour.clone()]

    for (let i = 0; i < 23; i++) {
      timeLabels.push(startHour.add(1, "hour").clone())
    }

    let timeScale = d3.scaleBand()
      .range([this.settings.label_padding, this.settings.width])
      .padding([0.05])
      .domain(timeLabels.map(hour => {
        return hour.hour()
      }))

    // Add day data items to the overview
    this.items.selectAll('.item-block-day').remove()
    this.items.selectAll('.item-block-day')
      .data(hoursInputs)
      .enter()
      .append('rect')
      .attr('class', 'item item-block-day')
      .style('cursor', 'pointer')
      .attr('x', function (d) {
        return timeScale(d.hour.clone().hour());
      })
      .attr('y', function (d) {
        return ((projectScale(d.hour.clone().format('dddd')) + projectScale.bandwidth() / 1.75) - 40);
      })
      .attr('width', () => {
        // console.log("Width items day", ((this.settings.width - this.settings.label_padding) / timeLabels.length - this.settings.gutter * 5));
        return 30
      })
      .attr('height', () => {
        return Math.min(projectScale.bandwidth(), this.settings.max_block_height)
      })
      // .attr('transform', d => {
      //   return 'translate(' + timeScale(d.hour.hour()) + ', 88' + ')'
      // })
      .attr('fill', d => {
        let color = d3.scaleLinear()
          .range(['#ffffff', this.props.color])
          .domain([-0.15 * max_value, max_value])
        return color(d.total) || '#ff4500'
      })
      .style('opacity', 0)
      .on('click', (event, d) => {
        if (this.in_transition) { return }

        // Don't transition if there is no data to show
        if (d.total === 0) { return }

        this.in_transition = true

        // Set selected date to the one clicked on
        this.selected = d

        // Hide tooltip
        this.hideTooltip()

        // Remove all month overview related items and labels
        this.removeDayOverview()

        // Redraw the chart
        this.overview = 'hour'
        this.drawChart()
      })
      .on('mouseenter', (event, d) => {
        if (this.in_transition) { return }

        this.setState({ fromOnPoint: true });

        let transitionDate = parseInt(this.tooltip.attr('date'));
        let transitionTotal = parseInt(this.tooltip.attr('total'))

        if (this.transitionHide && transitionDate === d.hour.clone().unix() && d.total === transitionTotal) {
          this.tooltip.transition().duration(0);
          return;
        }

        // Construct tooltip
        let tooltip_html = ''
        tooltip_html += `<div class="${styles.header}"><strong>${d.total ? this.formatAnomalyTxt(d.total) : 'No anomalies'} tracked</strong></div>`
        tooltip_html += '<div>at ' + d.hour.clone().hour() + ' hours</div><br>';

        // Add summary to the tooltip
        let counter = 0
        while (counter < d.servers.length) {
          tooltip_html += '<div><span><strong>' + d.servers[counter].name + '</strong></span>'
          tooltip_html += '<span> ' + this.formatAnomalyTxt(d.servers[counter].value) + '</span></div>'
          counter++
        }

        // Calculate tooltip position
        let x = event.pageX;
        let clientX = event.clientX;
        if (event.view.outerWidth - clientX < (this.settings.tooltip_width + 50)) {
          x = x - ((this.settings.tooltip_width + 50) - (event.view.outerWidth - clientX));
        }
        let y = event.pageY;

        // Show tooltip
        this.tooltip.html(tooltip_html)
          .style('left', x + 'px')
          .style('top', y + 'px')
          .style('opacity', 1)
          .attr('total', d.total)
          .attr('date', d.hour.clone().unix())
          .transition()
          .duration(0)
          .ease(d3.easeLinear)
      })
      .on('mouseleave', () => {
        if (this.in_transition) { return }
        this.tooltip.style('pointer-events', 'auto');
        this.hideTooltip('temp')
      })
      .transition()
      .delay(() => {
        return (Math.cos(Math.PI * Math.random()) + 1) * this.settings.transition_duration
      })
      .duration(() => {
        return this.settings.transition_duration
      })
      .ease(d3.easeLinear)
      .style('opacity', 1)
      .call((transition, callback) => {
        if (transition.empty()) {
          callback()
        }
        let n = 0
        transition
          .each(() => ++n)
          .on('end', function () {
            if (!--n) {
              callback.apply(this, arguments)
            }
          })
      }, () => {
        this.in_transition = false
      })

    // Add time labels
    this.labels.selectAll('.label-time-hours').remove()
    this.labels.selectAll('.label-time-hours')
      .data(timeLabels)
      .enter()
      .append('text')
      .attr('class', 'label label-time-hours')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return moment(d).format('HH:mm')
      })
      .attr('x', (d, i) => {
        return timeScale(i)
      })
      .attr('y', this.settings.label_padding / 2)
      .on('mouseenter', (event, hour) => {
        if (this.in_transition) { return }
        this.items.selectAll('.item-block-day')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', d => {
            return (d.hour.hour() === hour.hour()) ? 1 : 0.1
          })
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-day')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })

    // Add project labels
    let label_padding = this.settings.label_padding
    this.labelsVertical.selectAll('.label-project-hours').remove()
    this.labelsVertical.selectAll('.label-project-hours')
      .data(project_labels)
      .enter()
      .append('text')
      .attr('class', 'label label-project-hours')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('x', this.settings.label_padding / 3)
      .attr('y', d => {
        return projectScale(d) + projectScale.bandwidth() / 2
      })
      .attr('min-height', () => {
        return projectScale.bandwidth()
      })
      .style('text-anchor', 'left')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return d[0]
      })
      .each(function () {
        let obj = d3.select(this),
          text_length = obj.node().getComputedTextLength(),
          text = obj.text()
        while (text_length > (label_padding * 1.5) && text.length > 0) {
          text = text.slice(0, -1)
          obj.text(text + '...')
          text_length = obj.node().getComputedTextLength()
        }
      })
    // Add button to switch back to previous overview
    this.drawButton()
  }

  drawHourOverview() {
    // Add current overview to the history
    if (this.history[this.history.length - 1].overview !== this.overview) {
      this.history.push({ overview: this.overview, data: { ...this.selected } })
    }

    // Initialize selected date to today if it was not set
    if (!Object.keys(this.selected).length) {
      this.selected = this.props.data[this.props.data.length - 1]
    }

    let metricTags = false;
    let project_labels = [];
    this.selected.servers.forEach(project => {
      project_labels.push(project.name);
      if (project.metrics.length > 0) {
        metricTags = true;
      }
      project.metrics.forEach((metric) => {
        project_labels.push(metric);
      })
    })

    let newHeight = project_labels.length * 30 * 1.1;

    // console.log("Project labels", project_labels.length * 16);

    if (newHeight < this.settings.height) {
      newHeight = this.settings.height;
    }
    let padding = 0;
    let newWidth = this.settings.width;
    if (metricTags) {
      padding = 15;
      newWidth -= padding;
    }

    let projectScale = d3.scaleBand()
      .rangeRound([0, newHeight])
      .domain(project_labels)

    let startMinute = this.selected.hour.startOf('hour').clone();

    let timeLabels = [startMinute.clone()]

    for (let i = 1; i < 6; i++) {
      timeLabels.push(startMinute.clone().add(10 * i, "minutes"));
    }

    let itemScale = d3.scaleTime()
      .range([(this.settings.label_padding + padding) * 2, newWidth])
      .domain([this.selected.hour.startOf("hour").clone(), this.selected.hour.endOf('hour').clone()])

    let timeScale = d3.scaleTime()
      .range([(this.settings.label_padding + padding) * 2, newWidth])
      .domain([0, timeLabels.length])

    this.svg.attr('height', newHeight)
    this.svg.attr('width', this.settings.width)
    this.items.selectAll('.item-block-hour').remove()
    this.items.selectAll('.item-block-hour')
      .data(this.selected.details)
      .enter()
      .append('rect')
      .attr('class', 'item item-block-hour')
      .style('cursor', 'pointer')
      .attr('x', d => {
        // console.log("Hour to moment", d, moment.unix(d.date.seconds).format('LLL'));
        // console.log("X", itemScale(moment.unix(d.date.seconds)));
        console.log("X", itemScale(moment.unix(d.date.seconds)), moment.unix(d.date.seconds).format('LLLL'));
        return itemScale(moment.unix(d.date.seconds))
      })
      .attr('y', d => {
        // console.log("Y", (projectScale(d.name) + projectScale.bandwidth() / 2) - 15);
        console.log("Y d", d, metricTags);
        let projectToScale = metricTags ? ("MetricTag-" + d.name + ",;" + d.metric) : (d.name);
        console.log("Metric to scale", projectToScale);
        console.log("Y", (projectScale(projectToScale) + projectScale.bandwidth() / 2) - 15);
        return (projectScale(projectToScale) + projectScale.bandwidth() / 2) - 15
      })
      .attr('width', d => {
        let end = itemScale(d3.timeSecond.offset(moment.unix(d.date.seconds), 60));
        let maxValue = Math.max((end - itemScale(moment.unix(d.date.seconds))), 1);
        console.log("Width", maxValue);
        return maxValue
      })
      .attr('height', () => {
        return Math.min(projectScale.bandwidth(), this.settings.max_block_height)
      })
      .attr('fill', () => {
        return this.props.color
      })
      .style('opacity', 0)
      .on('mouseover', (event, d) => {
        if (this.in_transition) { return }

        // Construct tooltip
        let tooltip_html = ''
        tooltip_html += `<div class="${styles.header}"><strong>${d.name} - ${d.metric}</strong><div><br>`
        tooltip_html += '<div><strong>' + (d.value ? this.formatAnomalyTxt(d.value) : 'No time') + ' tracked</strong></div>'
        tooltip_html += '<div>on ' + moment.unix(d.date.seconds).format('dddd, MMM Do YYYY HH:mm:ss') + '</div>'

        // Calculate tooltip position
        let x = event.pageX;
        let clientX = event.clientX;
        if (event.view.outerWidth - clientX < (this.settings.tooltip_width + 50)) {
          x = x - ((this.settings.tooltip_width + 50) - (event.view.outerWidth - clientX));
        }
        let y = event.pageY;

        // Show tooltip
        this.tooltip.html(tooltip_html)
          .style('left', x + 'px')
          .style('top', y + 'px')
          .transition()
          .duration(this.settings.transition_duration / 2)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }
        this.hideTooltip()
      })
      .on('click', (event, d) => {
        this.queryAnomalyDetails(d.AnomalyID);
      })
      .transition()
      .delay(() => {
        return (Math.cos(Math.PI * Math.random()) + 1) * this.settings.transition_duration
      })
      .duration(() => {
        return this.settings.transition_duration
      })
      .ease(d3.easeLinear)
      .style('opacity', 0.5)
      .call((transition, callback) => {
        if (transition.empty()) {
          callback()
        }
        let n = 0
        transition
          .each(() => ++n)
          .on('end', function () {
            if (!--n) {
              callback.apply(this, arguments)
            }
          })
      }, () => {
        this.in_transition = false
      })

    // Add time labels
    this.labels.selectAll('.label-time-hour').remove()
    this.labels.selectAll('.label-time-hour')
      .data(timeLabels)
      .enter()
      .append('text')
      .attr('class', 'label label-time-hour')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .text(d => {
        return moment(d).format('HH:mm')
      })
      .attr('x', (d, i) => {
        return timeScale(i)
      })
      .attr('y', this.settings.label_padding / 2)

    // Add project labels
    let label_padding = this.settings.label_padding
    this.labelsVertical.selectAll('.label-project-hour').remove()
    this.labelsVertical.selectAll('.label-project-hour')
      .data(project_labels)
      .enter()
      .append('text')
      .attr('class', 'label label-project-hour')
      .style('cursor', 'pointer')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('x', project => {
        if (project.substr(0, 10) === "MetricTag-") {
          return this.settings.gutter + 10;
        }
        return this.settings.gutter;
      })
      .attr('y', d => {
        return projectScale(d) + projectScale.bandwidth() / 2
      })
      .attr('min-height', () => {
        return projectScale.bandwidth()
      })
      .style('text-anchor', 'left')
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 4) + 'px'
      })
      .text(d => {
        if (d.substr(0, 10) === "MetricTag-") {
          let index = d.indexOf(",;") + 2;
          return "- " + d.substr(index);
        }
        return "> " + d
      })
      .each(function () {
        let obj = d3.select(this),
          text_length = obj.node().getComputedTextLength(),
          text = obj.text()
        while (text_length > (label_padding * 2) && text.length > 0) {
          text = text.slice(0, -1)
          obj.text(text + '...')
          text_length = obj.node().getComputedTextLength()
        }
      })
      .on('mouseenter', (event, project) => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-hour')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', d => {
            let projectName = project;
            if (projectName.substr(0, 10) === "MetricTag-") {
              let index = projectName.indexOf(",;") + 2;
              console.log("ProjectName and index of ,:", projectName, index);
              let server = projectName.substr(10, index - 12);
              console.log("Server", server)
              projectName = projectName.substr(index);
              return (d.metric === projectName & d.name === server) ? 1 : 0.1
            } else {
              return (d.name === projectName) ? 1 : 0.1
            }
          })


        // Construct tooltip
        let index = project.indexOf(",;") + 2;
        let tooltip_html = ''
        tooltip_html += `<div class="${styles.header}"><strong>${project.substr(0, 10) === "MetricTag-" ? "Metric" : "Server"}</strong><div><br>`
        tooltip_html += `<div><strong>${project.substr(0, 10) === "MetricTag-" ? project.substr(index) : project}</strong></div>`

        // Calculate tooltip position
        let x = event.pageX;
        let clientX = event.clientX;
        if (event.view.outerWidth - clientX < (this.settings.tooltip_width + 50)) {
          x = x - ((this.settings.tooltip_width + 50) - (event.view.outerWidth - clientX));
        }
        let y = event.pageY;

        // Show tooltip
        this.tooltip.html(tooltip_html)
          .style('left', x + 'px')
          .style('top', y + 'px')
          .transition()
          .duration(this.settings.transition_duration / 2)
          .ease(d3.easeLinear)
          .style('opacity', 1)
      })
      .on('mouseout', () => {
        if (this.in_transition) { return }

        this.items.selectAll('.item-block-hour')
          .transition()
          .duration(this.settings.transition_duration)
          .ease(d3.easeLinear)
          .style('opacity', 0.5)

        this.hideTooltip()
      })

    // Add button to switch back to previous overview
    this.drawButton()
  }


  /**
   * Draw the button for navigation purposes
   */
  drawButton() {
    this.buttons.selectAll('.button').remove()
    let button = this.buttons.append('g')
      .attr('class', 'button button-back')
      .style('cursor', 'pointer')
      .attr('fill', 'transparent')
      .style('opacity', 0)
      .style('stroke-width', 2)
      .style('stroke', 'rgb(170, 170, 170)')
      .on('click', () => {
        if (this.in_transition) { return }

        // Set transition boolean
        this.fromClickedDate = true;
        this.in_transition = true

        // Clean the canvas from whichever overview type was on
        if (this.overview === 'year') {
          this.removeYearOverview()
        } else if (this.overview === 'month') {
          this.removeMonthOverview()
        } else if (this.overview === 'week') {
          this.removeWeekOverview()
        } else if (this.overview === 'day') {
          this.removeDayOverview()
        } else if (this.overview === 'hour') {
          this.setState({ showGraph: false });
          this.selected = this.selectedDay;
          this.removeHourOverview();
        }

        // Redraw the chart
        this.history.pop()
        let passValue = this.history.pop();
        this.overview = passValue.overview;
        this.selected = { ...passValue.data };
        this.drawChart()
      })
    button.append('circle')
      .attr('cx', this.settings.label_padding / 2.25)
      .attr('cy', this.settings.label_padding / 2.5)
      .attr('r', this.settings.item_size / 2)
    button.append('text')
      .style('stroke-width', 1)
      .style('text-anchor', 'middle')
      .style('fill', 'rgb(170, 170, 170)')
      .attr('x', this.settings.label_padding / 2.25)
      .attr('y', this.settings.label_padding / 2.5)
      .attr('dy', () => {
        return Math.floor(this.settings.width / 100) / 3
      })
      .attr('font-size', () => {
        return Math.floor(this.settings.label_padding / 3) + 'px'
      })
      .html('&#x2190')
    button.transition()
      .duration(this.settings.transition_duration)
      .ease(d3.easeLinear)
      .style('opacity', 1)
  }


  /**
   * Transition and remove items and labels related to global overview
   */
  removeGlobalOverview() {
    this.items.selectAll('.item-block-year')
      .transition()
      .duration(this.settings.transition_duration)
      .ease(d3.easeLinear)
      .style('opacity', 0)
      .remove()
    this.labels.selectAll('.label-year').remove()
  }


  /**
   * Transition and remove items and labels related to year overview
   */
  removeYearOverview() {
    this.setState({ fromOnPoint: false })
    this.items.selectAll('.item-circle')
      .transition()
      .duration(this.settings.transition_duration)
      .ease(d3.easeLinear)
      .style('opacity', 0)
      .remove()
    this.labelsVertical.selectAll('.label-day').remove()
    this.labels.selectAll('.label-month').remove()
    this.hideBackButton()
  }

  /**
   * Transition and remove items and labels related to month overview
   */
  removeMonthOverview() {
    this.setState({ fromOnPoint: false })
    this.items.selectAll('.item-block-month')
      .transition()
      .duration(this.settings.transition_duration)
      .ease(d3.easeLinear)
      .style('opacity', 0)
      .attr('x', (d, i) => {
        return (i % 2 === 0) ? -this.settings.width / 3 : this.settings.width / 3
      })
      .remove()
    this.labelsVertical.selectAll('.label-day').remove()
    this.labels.selectAll('.label-week').remove()
    this.hideBackButton()
  }


  /**
   * Transition and remove items and labels related to week overview
   */
  removeWeekOverview() {
    this.setState({ fromOnPoint: false })
    this.items.selectAll('.item-block-week')
      .transition()
      .duration(this.settings.transition_duration)
      .ease(d3.easeLinear)
      .style('opacity', 0)
      .attr('x', (d, i) => {
        return (i % 2 === 0) ? -this.settings.width / 3 : this.settings.width / 3
      })
      .remove()
    this.labelsVertical.selectAll('.label-day').remove()
    this.labels.selectAll('.label-week').remove()
    this.hideBackButton()
  }


  /**
   * Transition and remove items and labels related to daily overview
   */
  removeDayOverview() {
    this.setState({ fromOnPoint: false })
    this.items.selectAll('.item-block-day')
      .transition()
      .duration(this.settings.transition_duration)
      .ease(d3.easeLinear)
      .style('opacity', 0)
      .attr('x', (d, i) => {
        return (i % 2 === 0) ? -this.settings.width / 3 : this.settings.width / 3
      })
      .remove()
    this.labels.selectAll('.label-time-hours').remove()
    this.labelsVertical.selectAll('.label-project-hours').remove()
    this.hideBackButton()
  }

  /**
   * Transition and remove items and labels related to daily overview
   */
  removeHourOverview() {
    this.svg.attr('height', this.settings.height)
    this.svg.attr('width', this.settings.width)
    this.items.selectAll('.item-block-hour')
      .transition()
      .duration(this.settings.transition_duration)
      .ease(d3.easeLinear)
      .style('opacity', 0)
      .attr('x', (d, i) => {
        return (i % 2 === 0) ? -this.settings.width / 3 : this.settings.width / 3
      })
      .remove()
    this.labels.selectAll('.label-time-hour').remove()
    this.labelsVertical.selectAll('.label-project-hour').remove()
    this.hideBackButton()
  }


  delay(ms) {
    return new Promise((x) => {
      setTimeout(x, ms);
    });
  }

  /**
   * Helper function to hide the tooltip
   */
  async hideTooltip(origin = "Temp") {
    if (origin === "fromTooltip") {
      this.setState({ onTransitionHide: true });
      this.transitionHide = true;
      this.tooltip.transition()
        .delay(this.settings.transition_duration)
        .ease(d3.easeLinear)
        .style('opacity', 0)
        .style('pointer-events', 'none')
        .on('end', () => {
          this.setState({ onTransitionHide: false });
          this.transitionHide = false;
        })
        .on("interrupt", () => {
          this.setState({ onTransitionHide: false });
          this.transitionHide = false;
        })
        .on("cancel", () => {
          this.setState({ onTransitionHide: false });
          this.transitionHide = false;
        })
    } else {
      this.tooltip.transition()
        .delay(this.settings.transition_duration)
        .ease(d3.easeLinear)
        .style('opacity', 0)
        .style('pointer-events', 'none')
    }
  }


  /**
   * Helper function to hide the back button
   */
  hideBackButton() {
    this.buttons.selectAll('.button')
      .transition()
      .duration(this.settings.transition_duration)
      .ease(d3.easeLinear)
      .style('opacity', 0)
      .remove()
  }


  /**
   * Helper function to convert seconds to a human readable format
   * @param seconds Integer
   */

  render() {
    return (
      <Box sx={{ width: "100%", marginBottom: 2, height: "100%" }}>
        <Paper elevation={3} sx={{ width: "100%", height: "100%", padding: 2 }}>
          <Grid2 container direction="column" sx={{ width: "1100px", height: "500px", justifyContent: "center" }}>
            <Grid2>
              <Typography variant="h6" display="block" sx={{ textAlign: "center", marginBottom: 1 }}>
                Heatmap
              </Typography>
            </Grid2>
            <Grid2 container sx={{ justifyContent: "center" }}>
              <div className={styles.calendarHeatmap} id='time-labels' style={{ width: '1000px', height: '50px' }}>
              </div>
              <div id='calendar-heatmap'
                className={styles.calendarHeatmap}
                style={{ width: '1000px', height: '350px', overflowY: "auto", overflowX: "hidden" }}
                ref={elem => { this.container = elem }}>
              </div>
            </Grid2>
            <Grid2>
              <Fade in={this.state.loadingGraph} {...({ timeout: 1000 })}>
                <LinearProgress />
              </Fade>
            </Grid2>
            <Grid2>
              <Slide direction="left" in={this.state.showGraph} mountOnEnter unmountOnExit {...({ timeout: 1000 })}>
                <Grid2 container sx={{ width: "75vw", height: "65vh", justifiyContent: "center" }}>
                  <MainPageGraph tableData={[]} metricName={"Time Series"} data={this.state.graphData} unit={"hour"} detailsMode={true} serverName={this.state.serverName} />
                </Grid2>
              </Slide>
            </Grid2>
            <Grid2>
              <Typography variant="caption" display="block" sx={{ textAlign: "center", marginTop: 2 }}>
                HINT: Click on any date to see the anomalies detected.
              </Typography>
            </Grid2>
          </Grid2>
        </Paper>
      </Box>
    )
  }
}

CalendarHeatmap.defaultProps = {
  data: [],
  overview: 'year',
  color: '#ff4500',
  handler: undefined,
}

export default CalendarHeatmap