import React, { useMemo, useState, useEffect, useRef } from "react";
import { Line } from 'react-chartjs-2';
import { Chart } from "chart.js";
import { createCircle } from './CreateFigure';
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import Slide from '@mui/material/Slide';
import AnomalyDetails from "./AnomalyDetails";
import CircularProgress from '@mui/material/CircularProgress';
import AnomaliesTable from "./AnomaliesTable";
import { Data } from "pages/AnomalyFeed/components/AnomalyDetails";
import type { ChartOptions } from 'chart.js';

type ChartAnomaly = {
    anomaly: number;
    id: string;
    importance: number;
    status: number;
    x: moment.Moment;
    y: number;
}

type GraphCommonProps = {
    tableData: [];
    metricName: string;
    data: Data;
    unit: string;
    aspectRatio: boolean;
    detailsMode: boolean;
    serverName: string;
    graphAnimation: boolean;
    mode: string;
}

function GraphCommon(props: GraphCommonProps) {
    const [anomalyDetails, setAnomalyDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const anomalyIndex = useRef(-1);
    const detailsMode = props.detailsMode !== undefined ? props.detailsMode : false;

    const aspectRatio = props.aspectRatio ? props.aspectRatio : false;
    const graphAnimation = props.graphAnimation !== undefined ? props.graphAnimation : true;
    const mode = props.mode !== undefined ? props.mode : "point";
    const statusColor = {
        "-1": "#f7584d",
        "0": "#f5ce64",
        "1": "#007500",
        "2": "#808080"
    };

    useEffect(() => {
        console.log("Using callback");
        setAnomalyDetails(null);
    }, [props.metricName])

    const config = useMemo(() => ({
        responsive: true,
        animation: graphAnimation,
        maintainAspectRatio: aspectRatio,
        interaction: {
            intersect: false,
            mode: mode,
            axis: "xy"
        },
        onClick: function (e: any) {
            let chart = e.chart;
            if (chart) {
                var points = chart.getElementsAtEventForMode(e, 'nearest', { "intersect": false }, true);
                if (points[0] && detailsMode) {
                    const index = points[0].index;
                    const dataPoint = chart.config.data.datasets[0].data[index] as unknown as ChartAnomaly;
                    console.log("datapoint ID", dataPoint);
                    if (dataPoint !== null) {
                        if (dataPoint.id !== undefined) {
                            console.log("Anomaly Index:", chart.config.data.datasets);
                            chart.config.data.datasets[0].pointRadius[index] = 8;
                            if (anomalyIndex.current !== -1) {
                                chart.config.data.datasets[0].pointRadius[anomalyIndex.current] = 4;
                            }
                            chart.update();
                            anomalyIndex.current = index;
                            queryAnomalyDetails(dataPoint.id, props.serverName);
                        }
                    }
                }
            }
        },
        plugins: {
            zoom: {
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode: 'xy',
                },
                pan: {
                    enabled: true,
                    mode: 'xy',
                },
                limits: {
                    x: { min: 'original', max: 'original' },
                    y: { min: 'original', max: 'original' },
                }
            },
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    generateLabels: (chart: any) => {
                        return [{
                            text: chart.data.datasets[0].label,
                            fillStyle: '#3e95cd',
                            pointStyle: createCircle(152, 74, 4, chart.data.datasets[0].borderColor),
                            hidden: false,
                        },
                        {
                            text: "Positive Anomaly",
                            fillStyle: 'rgb(128,0,0)',
                            pointStyle: createCircle(152, 74, 4, "#007500"),
                            hidden: false
                        },
                        {
                            text: "Negative Anomaly",
                            fillStyle: 'rgb(128,0,0)',
                            pointStyle: createCircle(152, 74, 4, "#f7584d"),
                            hidden: false
                        },
                        {
                            text: "Snoozed Anomaly",
                            fillStyle: 'rgb(128,0,0)',
                            pointStyle: createCircle(152, 74, 4, "#f5ce64"),
                            hidden: false
                        },
                        {
                            text: "No Response Anomaly",
                            fillStyle: 'rgb(128,0,0)',
                            pointStyle: createCircle(152, 74, 4, "#808080"),
                            hidden: false
                        },
                        {
                            text: "95% Interval",
                            fillStyle: 'rbg(128,0,0)',
                            pointStyle: createCircle(152, 74, 4, "#81d4fa"),
                            hidden: false,
                        }]
                    },
                }
            },
            title: {
                display: true,
                text: props.metricName
            },
            filler: {
                propagate: false
            },
        },
        scales: {
            x: {
                type: "time",
                time: {
                    unit: props.unit,
                },
            },
        },
    }), [props.metricName, graphAnimation, aspectRatio, detailsMode, mode, props.unit, props.serverName]);

    const queryAnomalyDetails = async (id: string, title: string) => {
        setLoadingDetails(true);
        await fetch('https://anomalyhandling.azurewebsites.net/api/getinfofromanomaly', {
            method: 'POST',
            body: JSON.stringify({
                "Client_Name": "ELV",
                "Anomaly_ID": id,
                "Server_Name": title
            }),
            headers: {
                'Content-type': 'application/json',
            }
        })
            .then((response) => {
                if (!response.ok) {
                    console.log("Get failed");
                    console.log(response);
                    throw new Error(response.statusText);
                } else {
                    return response.json();
                }
            })
            .then((data) => {
                console.log("Getting anomaly details");
                console.log(data);
                setAnomalyDetails(data.doc_id);
                setLoadingDetails(false);
            })
            .catch((err) => {
                console.log(err.message);
                setAnomalyDetails(err.message);
                setLoadingDetails(false);
                //setError(err);
            });
    }

    const verticalLinePlugin = {
        id: "custom_line_drawer",
        getLinePosition: function (chart: Chart, pointIndex: number) {
            const meta = chart.getDatasetMeta(0); // first dataset is used to discover X coordinate of a point
            const data = meta.data;
            return data[pointIndex].x;
        },

        renderVerticalLine: function (chartInstance: Chart, pointIndex: number, dataIndex: ChartAnomaly) {
            const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
            const scale = chartInstance.scales.y;
            const context = chartInstance.ctx;

            // render vertical line
            let colorIndex = "2";
            if (dataIndex.status !== undefined) {
                colorIndex = dataIndex.status.toString()
            }
            context.beginPath();
            context.lineWidth = 2;
            context.strokeStyle = statusColor[colorIndex as keyof typeof statusColor];
            context.moveTo(lineLeftOffset, scale.top);
            context.lineTo(lineLeftOffset, scale.bottom);
            context.stroke();
        },

        afterDatasetsDraw: function (chart: any) {
            if (chart.config.data.datasets[0].lineAtIndex.length > 0) {
                chart.config.data.datasets[0].lineAtIndex.forEach((pointIndex: number) => {
                    let dataIndex = chart.config.data.datasets[0].data[pointIndex];
                    this.renderVerticalLine(chart, pointIndex, dataIndex)
                }
                );
            }
        },
    };

    const myLineChart = <Line options={config as ChartOptions<'line'>} data={props.data} plugins={[verticalLinePlugin]} />

    return (
        <Grid2 container direction="column" sx={{ width: "100%", height: "100%" }}>
            <Grid2 container direction="row" sx={{ width: "100%", height: aspectRatio ? "100%" : "50vh", justifyContent: "space-between" }}>
                <Grid2 sx={{ width: ((anomalyDetails || loadingDetails) ? "74%" : "100%"), height: "100%" }}>
                    {myLineChart}
                </Grid2>
                {loadingDetails ? (
                    <Grid2 container sx={{ width: "24%", height: "100%", justifyContent: "center", alignItems: "center" }}>
                        <CircularProgress />
                    </Grid2>
                ) : (
                    <>
                        {anomalyDetails && (
                            <div style={{ width: "24%", overflowY: "auto", height: "48vh" }}>
                                <Slide direction="left" in={true} mountOnEnter unmountOnExit {...({ timeout: 1000 })}>
                                    <Grid2 sx={{ width: "100%", overflowY: "auto", height: "100%" }}>
                                        <AnomalyDetails loading={loadingDetails} anomalyDetails={anomalyDetails} />
                                    </Grid2>
                                </Slide>
                            </div>
                        )}
                    </>
                )}
            </Grid2>
            {props.tableData.length > 0 && (
                <Grid2 sx={{ height: "100%" }}>
                    <AnomaliesTable data={props.tableData} />
                </Grid2>
            )}
        </Grid2>
    );
}

export default GraphCommon;