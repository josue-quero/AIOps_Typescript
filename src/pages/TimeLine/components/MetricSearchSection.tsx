import React, { useState, useEffect } from "react";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import Divider from '@mui/material/Divider';
import AnomaliesCard from "./AnomaliesCard";
import Grow from '@mui/material/Grow';
import CircularProgress from '@mui/material/CircularProgress';
import moment from 'moment-timezone';
import ReplayIcon from '@mui/icons-material/Replay';
import Fade from "@mui/material/Fade";
import IconButton from '@mui/material/IconButton';
import GraphsSection from "./GraphsSection";

const timeStampOptions = {
    1: "Last Hour",
    6: "Last 6 Hours",
    24: "Last 24 hours",
    168: "Last Week",
}

function MetricSearchSection({ blobList }) {
    const [loadingServers, setLoadingServers] = useState(false);
    const [anomaliesCounter, setAnomaliesCounter] = useState(null);
    const [serverNames, setServerNames] = useState([]);
    const [timeStamp, setTimeStamp] = useState(1);
    const [serverName, setServerName] = useState(null);
    const [metricNames, setMetricNames] = useState({});
    const [lastUpdate, setLastUpdate] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [metricsAnomalies, setMetricsAnomalies] = useState(null);

    function getServerList(blobList, time) {
        const tempDate = moment().utc().add(-time, "hours");
        const exactLimitDate = tempDate.clone();
        const limitDate = tempDate.startOf("day").clone();
        let hour = exactLimitDate.hours();
        let anomalyCounter = {
            "Total": 0,
            "Negative": 0,
            "Positive": 0,
            "Snoozed": 0,
            "No Feedback": 0,
        }
        console.log("Limit Date", limitDate.format('LLL'));
        console.log("Exact limit date", exactLimitDate.format('LLL'));
        let metricsWAnomalies = {};
        let serverList = {};
        blobList.forEach((day) => {
            // First day retreived check
            let tempCurrentDay = moment.utc(day.date, "YYYY-MM-DD HH:mm:ss");
            if (tempCurrentDay.isSame(limitDate) || tempCurrentDay.isAfter(limitDate)) {
                if (tempCurrentDay.isSame(limitDate)) {
                    if (day.dayData[hour] !== undefined) {
                        for (let i = 0; i < day.dayData[hour].details.length; i++) {
                            console.log("Dates in ", hour, moment.unix(day.dayData[hour].details[i].date.seconds).utc().format('LLL'))
                            if (moment.unix(day.dayData[hour].details[i].date.seconds).utc().isAfter(exactLimitDate) || moment.unix(day.dayData[hour].details[i].date.seconds).utc().isSame(exactLimitDate)) {
                                metricsWAnomalies[day.dayData[hour].details[i].name] = { [day.dayData[hour].details[i].metric]: 1 };
                                serverList[day.dayData[hour].details[i].name] = true;
                                anomalyCounter["Total"] += 1;
                                let hasFeedback = false;
                                if (day.dayData[hour].total_negative !== undefined) {
                                    if (day.dayData[hour].total_negative[day.dayData[hour].details[i].AnomalyID] !== undefined) {
                                        hasFeedback = true;
                                        anomalyCounter["Negative"] += day.dayData[hour].total_negative[day.dayData[hour].details[i].AnomalyID];
                                    }
                                }
                                if (day.dayData[hour].total_positive !== undefined) {
                                    if (day.dayData[hour].total_positive[day.dayData[hour].details[i].AnomalyID] !== undefined) {
                                        hasFeedback = true;
                                        anomalyCounter["Positive"] += day.dayData[hour].total_positive[day.dayData[hour].details[i].AnomalyID];
                                    }
                                }
                                if (day.dayData[hour].total_snoozed !== undefined) {
                                    if (day.dayData[hour].total_snoozed[day.dayData[hour].details[i].AnomalyID] !== undefined) {
                                        hasFeedback = true;
                                        anomalyCounter["Snoozed"] += day.dayData[hour].total_snoozed[day.dayData[hour].details[i].AnomalyID]
                                    }
                                }
                                if (!hasFeedback) {
                                    anomalyCounter["No Feedback"] += 1;
                                }
                                console.log("When added server name", serverList);
                            }
                        }
                    }
                    for (let i = hour + 1; i < 24; i++) {
                        if (day.dayData[i] !== undefined) {
                            // For debugging
                            // console.log("hourDetails", i);
                            // day.dayData[i].details.map((hourDetails) => {
                            //     console.log(moment.unix(hourDetails.date.seconds).utc().format("MMMM, h:mm:ss a"));
                            // })
                            console.log("Appending servers to server list");
                            Object.keys(day.dayData[i].servers).forEach((server) => {
                                let tempMerged = { ...metricsWAnomalies[server], ...day.dayData[i].servers[server] }
                                metricsWAnomalies[server] = tempMerged;
                                serverList[server] = true;
                            })
                            anomalyCounter["Total"] += day.dayData[i].total;
                            anomalyCounter["Negative"] += day.dayData[i].total_negative !== undefined ? day.dayData[i].total_negative.total : 0;
                            anomalyCounter["Positive"] += day.dayData[i].total_positive !== undefined ? day.dayData[i].total_positive.total : 0;
                            anomalyCounter["Snoozed"] += day.dayData[i].total_snoozed !== undefined ? day.dayData[i].total_snoozed.total : 0;
                            anomalyCounter["No Feedback"] += Object.keys(day.dayData[i].total_no_feedback).length;
                        }
                    }
                } else {
                    Object.keys(day.servers).forEach((server) => {
                        let tempMerged = { ...metricsWAnomalies[server], ...day.servers[server] }
                        metricsWAnomalies[server] = tempMerged;
                        serverList[server] = true;
                    })
                    anomalyCounter["Total"] += day.total;
                    anomalyCounter["Negative"] += day.total_negative !== undefined ? day.total_negative : 0;
                    anomalyCounter["Positive"] += day.total_positive !== undefined ? day.total_positive : 0;
                    anomalyCounter["Snoozed"] += day.total_snoozed !== undefined ? day.total_snoozed : 0;
                    anomalyCounter["No Feedback"] += Object.keys(day.total_no_feedback).length;
                }
            }
        })
        const tempServerNames = Object.keys(serverList).map((serverKey) => {
            return serverKey;
        }).sort()
        console.log("Anomaly counter", anomalyCounter);
        setServerNames(tempServerNames);
        console.log("MetricsWAnomalies", metricsWAnomalies);
        console.log("Server names", tempServerNames);
        setMetricsAnomalies(metricsWAnomalies);
        setServerName(prev => {
            if (prev === null) {
                return tempServerNames[0];
            }
            return prev;
        });

        setAnomaliesCounter({ data: anomalyCounter, time: time });
        setLoadingServers(false);
    }

    const onChangeTimeStamp = (option) => {
        setServerName(null);
        setTimeStamp(option);
        getServerList(blobList, option);
    }

    // const handleChangeServerName = (name) => setServerName(name);

    useEffect(() => {
        console.log("BlobList metrics section", blobList);
        if (blobList) {
            getServerList(blobList, timeStamp);
        }
        // eslint-disable-next-line
    }, [blobList]);

    useEffect(() => {
        if (serverName) {
            // console.log("Loading metrics");
            const queryMetrics = async (option) => {
                if (metricNames[serverName] === undefined) {
                    setLoadingMetrics(true);
                    await fetch('https://aiopsnodefunctions-nodefunctionsqa.azurewebsites.net/api/getmetricsfromdevice', {
                        method: 'POST',
                        body: JSON.stringify({
                            device: option,
                        }),
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                        .then((response) => {
                            if (!response.ok) {
                                return response.text().then((text) => {
                                    // console.log("Get failed");
                                    // console.log(text);
                                    throw new Error(text);
                                });
                            } else {
                                return response.json();
                            }
                        })
                        .then((data) => {
                            // console.log("Metric Names");
                            // console.log(data);
                            let tempMetricNames = metricNames;
                            tempMetricNames[option] = data;
                            setMetricNames(tempMetricNames);
                            setLastUpdate(moment());
                            setLoadingMetrics(false);
                        })
                        .catch((err) => {
                            // console.log(err);
                            //setError(err);
                        });
                } else {
                    setLastUpdate(moment());
                }
            }
            queryMetrics(serverName);
        }
    }, [serverName, metricNames]);


    const onChangeServerName = (name) => {
        setServerName(name);
    }

    const handleRefresh = () => {
        setMetricNames({});
    }

    // console.log("Rendering metrics search");
    return (
        <Fade in={true} {...({ timeout: 1000 })}>
            <Grid2 container sx={{ justifyContent: "center", alignItems: "center", width: "100%" }} direction="column">
                <Grid2 container direction="row" sx={{ width: "100%", alignItems: "center" }}>
                    <Typography variant="h6" sx={{ textAlign: "center" }}>
                        Search Metrics
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="subtitle2" sx={{ marginRight: 1 }}>
                        Last queried on: {lastUpdate !== null ? lastUpdate.clone().format("MMMM, D h:mm:ss a") : "----/--/--"}
                    </Typography>
                    <IconButton aria-label="replay" onClick={handleRefresh}>
                        <ReplayIcon />
                    </IconButton>
                </Grid2>
                <Divider sx={{ width: "100%", marginBottom: 1 }} />
                <Typography sx={{ alignText: "center", marginBottom: 2 }} align="center" variant="subtitle2">
                    Select the period of time and the server you want to visualize, then you'll be able to see all of the anomalies in said period of time by metric.
                </Typography>
                {anomaliesCounter ? (
                    <Grow in={anomaliesCounter !== null} style={{ transformOrigin: '0 0 0' }} {...({ timeout: 1000 })}>
                        <Grid2 container sx={{ justifyContent: "center", width: "100%", alignItems: "center" }}>
                            <AnomaliesCard anomaliesCounter={anomaliesCounter} loading={loadingServers} />
                        </Grid2>
                    </Grow>
                ) : (
                    <Grid2 container sx={{ justifyContent: "center", width: "100%", alignItems: "center" }} direction="column">
                        <CircularProgress />
                    </Grid2>
                )}
                <Grid2 container sx={{ justifyContent: "center", alignItems: "center" }} direction="row">
                    <FormControl sx={{ m: 1, minWidth: 200, maxWidth: 400, width: "30%" }} size="small" >
                        <InputLabel id="demo-simple-select-helper-label">Timeframe</InputLabel>
                        <Select
                            labelId="demo-simple-select-helper-label"
                            id="demo-simple-select-helper"
                            value={timeStamp}
                            label="Time frame"
                            onChange={(event) => onChangeTimeStamp(event.target.value)}
                        >
                            {Object.keys(timeStampOptions).map((key, index) => {
                                return (
                                    <MenuItem key={index} value={key}>
                                        {timeStampOptions[key]}
                                    </MenuItem>)
                            })}
                        </Select>
                        <FormHelperText>Select the TimeFrame</FormHelperText>
                    </FormControl>
                    <FormControl sx={{ m: 1, minWidth: 200, maxWidth: 400, width: "30%" }} disabled={!serverName} size="small">
                        <InputLabel id="demo-simple-select-helper-label">{!serverName ? "No anomalies" : "Server  Name"}</InputLabel>
                        <Select
                            labelId="demo-simple-select-helper-label"
                            id="demo-simple-select-helper"
                            value={serverName || ''}
                            label="Server Name"
                            onChange={(e) => onChangeServerName(e.target.value)}
                        >
                            {serverNames.map((key, index) => {
                                return (
                                    <MenuItem key={index} value={key}>
                                        {key}
                                    </MenuItem>)
                            })}
                        </Select>
                        <FormHelperText>Select the desired server</FormHelperText>
                    </FormControl>
                </Grid2>
                {(serverName) && (
                    <div style={{ width: "100%" }}>
                        {(metricNames[serverName] && !loadingMetrics) ? (
                            <Fade in={true} {...({ timeout: 1000 })}>
                                <div style={{ width: "100%" }}>
                                    <GraphsSection metricsAnomalies={metricsAnomalies[serverName]} metricNames={metricNames[serverName]} serverName={serverName} timeStamp={timeStamp} timeUpperLimit={lastUpdate.clone().utc().format("Y-M-D H:m")} />
                                </div>
                            </Fade>
                        ) : (
                            <Grid2 container sx={{ justifyContent: "center" }}>
                                <CircularProgress />
                            </Grid2>
                        )}
                    </div>
                )}
            </Grid2>
        </Fade>
    );
}

export default MetricSearchSection;