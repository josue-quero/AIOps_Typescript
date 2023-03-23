import React, { useEffect, useState } from 'react';
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import HeatMapSection from "./HeatMapSection";
// import OverviewCardsSection from './OverviewCardsSection';
import { collection, query, orderBy, getDocs, limit, where } from "firebase/firestore";
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import moment from 'moment-timezone';
import { db } from '../../../firebase/aiops';
// import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';

const timeStampOptions = {
    "day": "This Day",
    "week": "This Week",
    "month": "This Month",
    "year": "This Year",
}

export default function OverviewGraphs(props) {
    const [firstDoc, setFirstDoc] = useState(null);
    const [yearRange, setYearRange] = useState(null);
    const [timeStamp, setTimeStamp] = useState("year");
    const [selectedYear, setSelectedYear] = useState(moment().year());
    const [blobList, setBlobList] = useState(null);
    // const [listError, setListError] = useState(null);
    // const [loadingList, setLoadingList] = useState(true);

    const [parsedData, setParsedData] = useState(null);

    useEffect(() => {
        const getFirstYear = async () => {
            const first = query(collection(db, 'Instances', "Elevate", "AnomaliesHeatMap"), orderBy("date", "asc"), limit(1));
            const documentSnapshots = await getDocs(first);
            documentSnapshots.forEach((doc) => {
                setFirstDoc(doc.data());
                // console.log("first document", doc.data());
            })
        }
        getFirstYear();
    }, [])

    useEffect(() => {
        if (firstDoc !== null) {
            let firstYear = moment(firstDoc.date, "YYYY-MM-DD HH:mm:ss").year();
            let currentYear = moment().year();
            let tempYears = [];
            for (let i = firstYear; i <= currentYear; i++) {
                tempYears.push(i);
            }
            setYearRange(tempYears);
        }
    }, [firstDoc]);

    useEffect(() => {
        if (yearRange !== null && selectedYear !== null) {
            // if (selectedYear === moment().year()) {
            //     // console.log("Getting current year");
            //     const limitDate = moment()
            //         .startOf('year').utc()
            //         .format('YYYYMMDD');
            //     // console.log("Limit Date", limitDate);
            //     const limitDateNumber = parseInt(limitDate, 10) * 1000000;
            //     // console.log("Inside ref current");
            //     const q = query(collection(db, 'Instances', "Elevate", "AnomaliesHeatMap"), where('date', '>=', limitDateNumber));
            //     const unsubscribe = onSnapshot(q, (querySnapshot) => {
            //         console.log("Triggered overview snapshot");
            //         const docList = querySnapshot.docs.map(doc => doc.data());
            //         setBlobList(docList);
            //         setLoadingList(false);
            //     }, (error) => {
            //         setListError(error);
            //     });
            //     return () => unsubscribe();
            // } else {
            const getYearData = async () => {
                // console.log("Selected year and type", selectedYear, typeof (selectedYear));
                console.log("Selected year", selectedYear);
                const upperDate = moment(selectedYear.toString())
                    .endOf('year').utc()
                    .format('YYYYMMDD');
                const upperLimit = parseInt(upperDate, 10) * 1000000;
                // console.log("Upper limit Date", upperLimit);
                const lowerDate = moment(selectedYear.toString())
                    .utc()
                    .format('YYYYMMDD');
                const lowerLimit = parseInt(lowerDate, 10) * 1000000;
                // console.log("Lower limit date", lowerLimit);
                const q = query(collection(db, 'Instances', "Elevate", "AnomaliesHeatMap"), where("date", "<", upperLimit), where("date", ">=", lowerLimit));
                const documentSnapshots = await getDocs(q);
                let docList = [];
                documentSnapshots.forEach((doc) => {
                    docList.push(doc.data());
                });
                console.log("DOCS from year", docList);
                setBlobList(docList);
            }
            getYearData();
            // }
        }
    }, [yearRange, selectedYear])

    useEffect(() => {
        if (blobList !== null) {
            let tempBlobList = [...blobList];
            const cleanCurrentDay = (currentDayData) => {
                // console.log("Current dayData at end of day", currentDayData);
                currentDayData["dayData"] = {};
                currentDayData["servers"] = {};
                currentDayData["total"] = 0;
                currentDayData["total_positive"] = 0;
                currentDayData["total_negative"] = 0;
                currentDayData["total_snoozed"] = 0;
                currentDayData["total_no_feedback"] = 0;
                currentDayData["date"] = null;
                currentDayData["summary"] = [];
                // console.log("Current dayData after clear", currentDayData);
            }

            const parseBeforeOffset = (day, utcDay, localDay, offsetHours, currentDayData, yearlyAnomalyCounter, offsetMinutes, balanceHour) => {
                // If it's not a continuation of a previous day
                if (currentDayData.date === null) {
                    // If the local time is -utc the second half (from the offset hour) after the start of the local day
                    // will be the same utc date. Else the local time is +utc or equal to utc and the second half
                    // will be one day less as the utc date.
                    // console.log("Day in parse before offset", day);
                    // console.log("Before offset, utcDay and localDay, is utcDay before localDay?", utcDay.format('LLLL'), localDay.format('LLLL'), utcDay.isBefore(localDay));
                    if (utcDay.isBefore(localDay)) {
                        currentDayData["date"] = moment(day.date, "YYYY-MM-DD HH:mm:ss");
                    } else {
                        currentDayData["date"] = moment(day.date, "YYYY-MM-DD HH:mm:ss").subtract(1, "days");
                    }
                }
                for (let i = 0; i < offsetHours; i++) {
                    if (day.dayData[i] !== undefined) {
                        // If the local time has utc offset with not whole hours
                        if (offsetMinutes !== 0) {
                            day.dayData[i].details.forEach((anomaly) => {
                                let tempDate = moment.unix(anomaly.date.seconds).utc();
                                if (tempDate.minute() <= offsetMinutes) {
                                    if (currentDayData["dayData"][i + balanceHour].details !== undefined) {
                                        currentDayData["dayData"][i + balanceHour].details.push(anomaly);
                                        // Modifying count for hour
                                        if (currentDayData["dayData"][i].servers[anomaly.name] !== undefined) {
                                            if (isNaN(day.dayData[i].servers[anomaly.name])) {
                                                currentDayData["dayData"][i + balanceHour].servers[anomaly.name] += day.dayData[i].servers[anomaly.name].total;
                                            } else {
                                                currentDayData["dayData"][i + balanceHour].servers[anomaly.name] += day.dayData[i].servers[anomaly.name];
                                            }
                                        } else {
                                            if (isNaN(day.dayData[i].servers[anomaly.name])) {
                                                currentDayData["dayData"][i + balanceHour].servers[anomaly.name] = day.dayData[i].servers[anomaly.name].total;
                                            } else {
                                                currentDayData["dayData"][i + balanceHour].servers[anomaly.name] = day.dayData[i].servers[anomaly.name];
                                            }
                                        }
                                        // Modifying count for day
                                        if (currentDayData.servers[anomaly.name] !== undefined) {
                                            if (isNaN(day.dayData[i].servers[anomaly.name])) {
                                                currentDayData.servers[anomaly.name] += day.dayData[i].servers[anomaly.name].total;
                                            } else {
                                                currentDayData.servers[anomaly.name] += day.dayData[i].servers[anomaly.name];
                                            }
                                        } else {
                                            if (isNaN(day.dayData[i].servers[anomaly.name])) {
                                                currentDayData.servers[anomaly.name] = day.dayData[i].servers[anomaly.name].total;
                                            } else {
                                                currentDayData.servers[anomaly.name] = day.dayData[i].servers[anomaly.name];
                                            }
                                        }

                                    } else {
                                        currentDayData["dayData"][i + balanceHour]["details"] = [anomaly];
                                    }
                                }
                            })
                        }
                        let adjustedI = i;
                        if (i + balanceHour > 23) {
                            adjustedI = balanceHour - (24 - i);
                        } else if (i + balanceHour < 0) {
                            adjustedI = 24 + (balanceHour + i);
                        } else {
                            adjustedI = i + balanceHour;
                        }
                        currentDayData["dayData"][adjustedI] = day.dayData[i];
                        Object.keys(day.dayData[i].servers).forEach((server) => {
                            // console.log("Server name", server);
                            if (currentDayData["servers"][server] !== undefined) {
                                if (isNaN(day.dayData[i].servers[server])) {
                                    currentDayData["servers"][server] += day.dayData[i].servers[server].total;
                                } else {
                                    currentDayData["servers"][server] += day.dayData[i].servers[server];
                                }
                            } else {
                                if (isNaN(day.dayData[i].servers[server])) {
                                    currentDayData["servers"][server] = day.dayData[i].servers[server].total;
                                } else {
                                    currentDayData["servers"][server] = day.dayData[i].servers[server];
                                }
                            }
                        });
                        currentDayData["total"] += day.dayData[i].total;
                        yearlyAnomalyCounter["Total"] += day.dayData[i].total;
                        if (day.dayData[i].total_positive !== undefined) {
                            if (day.dayData[i].total_positive.total !== undefined) {
                                currentDayData["total_positive"] += day.dayData[i].total_positive.total;
                                yearlyAnomalyCounter["Positive"] += day.dayData[i].total_positive.total;
                            } else {
                                currentDayData["total_positive"] += day.dayData[i].total_positive;
                                yearlyAnomalyCounter["Positive"] += day.dayData[i].total_positive;
                            }
                        }
                        if (day.dayData[i].total_negative !== undefined) {
                            if (day.dayData[i].total_negative.total !== undefined) {
                                currentDayData["total_negative"] += day.dayData[i].total_negative.total;
                                yearlyAnomalyCounter["Negative"] += day.dayData[i].total_negative.total;
                            } else {
                                currentDayData["total_negative"] += day.dayData[i].total_negative;
                                yearlyAnomalyCounter["Negative"] += day.dayData[i].total_negative;
                            }
                        }
                        if (day.dayData[i].total_snoozed !== undefined) {
                            if (day.dayData[i].total_snoozed.total !== undefined) {
                                currentDayData["total_snoozed"] += day.dayData[i].total_snoozed.total;
                                yearlyAnomalyCounter["Snoozed"] += day.dayData[i].total_snoozed.total;
                            } else {
                                currentDayData["total_snoozed"] += day.dayData[i].total_snoozed;
                                yearlyAnomalyCounter["Snoozed"] += day.dayData[i].total_snoozed;
                            }
                        }
                        if (day.dayData[i].total_no_feedback !== undefined) {
                            currentDayData["total_no_feedback"] += Object.keys(day.dayData[i].total_no_feedback).length;
                            yearlyAnomalyCounter["No Feedback"] += Object.keys(day.dayData[i].total_no_feedback).length;
                        }
                    }
                }
                // console.log("Before making summary", currentDayData.servers);
                let unsorted_summary = Object.keys(currentDayData.servers).map(
                    (key) => {
                        // serverList[key] = true;
                        return {
                            name: key,
                            value: currentDayData.servers[key],
                        };
                    }
                );

                currentDayData["summary"] = unsorted_summary.sort((a, b) => {
                    return b.value - a.value;
                });
            }

            const parseAfterOffset = (day, utcDay, localDay, offsetHours, currentDayData, yearlyAnomalyCounter, offsetMinutes, balanceHour) => {
                // If the local time is +utc the second half (from the offset hour) after the start of the local day
                // will be a day more than the utc date. Else the local time is -utc or equal to utc and the second half
                // will be the same date as the utc date.
                // console.log("Day in parse after offset", day);
                // console.log("After offset, utcDay and localDay, is utcDay before localDay?", utcDay.format('LLLL'), localDay.format('LLLL'), utcDay.isBefore(localDay));
                if (utcDay.isBefore(localDay)) {
                    currentDayData["date"] = moment(day.date, "YYYY-MM-DD HH:mm:ss").add(1, "days");
                } else {
                    currentDayData["date"] = moment(day.date, "YYYY-MM-DD HH:mm:ss");
                }
                for (let i = offsetHours; i < 24; i++) {
                    if (day.dayData[i] !== undefined) {
                        // console.log("data in hour", i, day.dayData[i]);
                        let adjustedI = i;
                        if (i + balanceHour > 23) {
                            adjustedI = balanceHour - (24 - i);
                        } else if (i + balanceHour < 0) {
                            adjustedI = 24 + (balanceHour + i);
                        } else {
                            adjustedI = i + balanceHour;
                        }
                        currentDayData.dayData[adjustedI] = day.dayData[i];
                        Object.keys(day.dayData[i].servers).forEach((server) => {
                            if (currentDayData["servers"][server] !== undefined) {
                                if (isNaN(day.dayData[i].servers[server])) {
                                    currentDayData["servers"][server] += day.dayData[i].servers[server].total;
                                } else {
                                    currentDayData["servers"][server] += day.dayData[i].servers[server];
                                }
                            } else {
                                if (isNaN(day.dayData[i].servers[server])) {
                                    currentDayData["servers"][server] = day.dayData[i].servers[server].total;
                                } else {
                                    currentDayData["servers"][server] = day.dayData[i].servers[server];
                                }
                            }
                        });
                        currentDayData["total"] += day.dayData[i].total;
                        yearlyAnomalyCounter["Total"] += day.dayData[i].total;
                        if (day.dayData[i].total_positive !== undefined) {
                            if (day.dayData[i].total_positive.total !== undefined) {
                                currentDayData["total_positive"] += day.dayData[i].total_positive.total;
                                yearlyAnomalyCounter["Positive"] += day.dayData[i].total_positive.total;
                            } else {
                                currentDayData["total_positive"] += day.dayData[i].total_positive;
                                yearlyAnomalyCounter["Positive"] += day.dayData[i].total_positive;
                            }
                        }
                        if (day.dayData[i].total_negative !== undefined) {
                            if (day.dayData[i].total_negative.total !== undefined) {
                                currentDayData["total_negative"] += day.dayData[i].total_negative.total;
                                yearlyAnomalyCounter["Negative"] += day.dayData[i].total_negative.total;
                            } else {
                                currentDayData["total_negative"] += day.dayData[i].total_negative;
                                yearlyAnomalyCounter["Negative"] += day.dayData[i].total_negative;
                            }
                        }
                        if (day.dayData[i].total_snoozed !== undefined) {
                            if (day.dayData[i].total_snoozed.total !== undefined) {
                                currentDayData["total_snoozed"] += day.dayData[i].total_snoozed.total;
                                yearlyAnomalyCounter["Snoozed"] += day.dayData[i].total_snoozed.total;
                            } else {
                                currentDayData["total_snoozed"] += day.dayData[i].total_snoozed;
                                yearlyAnomalyCounter["Snoozed"] += day.dayData[i].total_snoozed;
                            }
                        }
                        if (day.dayData[i].total_no_feedback !== undefined) {
                            currentDayData["total_no_feedback"] += Object.keys(day.dayData[i].total_no_feedback).length;
                            yearlyAnomalyCounter["No Feedback"] += Object.keys(day.dayData[i].total_no_feedback).length;
                        }
                    }
                }
            }

            let heatMapData = [];
            // let serverList = {};
            let currentDayData = {
                date: null,
                dayData: {},
                servers: {},
                total: 0,
                total_positive: 0,
                total_negative: 0,
                total_snoozed: 0,
                total_no_feedback: 0,
                summary: [],
            };
            let yearlyAnomalyCounter = {
                "Total": 0,
                "Negative": 0,
                "Positive": 0,
                "Snoozed": 0,
                "No Feedback": 0,
            };
            let offsetHours = moment().startOf("day").utc().hour();
            let offsetMinutes = moment().startOf("day").utc().minute();
            // console.log("Offset hours and minutes", offsetHours, offsetMinutes);
            let firstDay = tempBlobList[0];
            let firstDayDate = moment.utc(firstDay.date, "YYYY-MM-DD HH:mm:ss"); // To make sure that is utc
            // console.log("First day original vs moment", firstDay.date, firstDayDate.format('LLLL'));
            let utcOffset = moment().utcOffset();
            let balanceHour = utcOffset / 60;
            console.log("Utc offset and balanceHour", utcOffset, balanceHour);
            let localFirstDayDate = firstDayDate.clone().add(utcOffset, 'minutes');
            // console.log("Local first day date", localFirstDayDate.format('LLLL'));
            // If there is a need for offsetting because local and utc time are not the same we begin the parsing
            if (firstDayDate.hour() !== localFirstDayDate.hour()) {
                // If the first day in array its the start of the year
                if (firstDayDate.isSame(moment(selectedYear).startOf("year").utc().startOf('day'))) {
                    tempBlobList.shift(); // Removes the first day
                    parseAfterOffset(firstDay, firstDayDate, localFirstDayDate, offsetHours, currentDayData, yearlyAnomalyCounter, offsetMinutes, balanceHour);
                    // Checking if the following day in the list is not within a day's distance
                    // if so, we add the uncomplete day to our parsed list
                    if (Object.keys(currentDayData.dayData).length !== 0) {
                        if (tempBlobList[0] !== undefined) {
                            // console.log("Distance in days", tempBlobList[0].date - firstDay.date);
                            if (tempBlobList[0].date - firstDay.date > 1000000) {
                                let unsorted_summary = Object.keys(currentDayData.servers).map(
                                    (key) => {
                                        // serverList[key] = true;
                                        return {
                                            name: key,
                                            value: currentDayData.servers[key],
                                        };
                                    }
                                );

                                currentDayData["summary"] = unsorted_summary.sort((a, b) => {
                                    return b.value - a.value;
                                });
                                heatMapData.push({ ...currentDayData });
                                cleanCurrentDay(currentDayData);
                            }
                        } else {
                            let unsorted_summary = Object.keys(currentDayData.servers).map(
                                (key) => {
                                    // serverList[key] = true;
                                    return {
                                        name: key,
                                        value: currentDayData.servers[key],
                                    };
                                }
                            );

                            currentDayData["summary"] = unsorted_summary.sort((a, b) => {
                                return b.value - a.value;
                            });
                            heatMapData.push({ ...currentDayData });
                            cleanCurrentDay(currentDayData);
                        }
                    }
                }
                tempBlobList.forEach((day, index) => {
                    let utcDay = moment.utc(day.date, "YYYY-MM-DD HH:mm:ss");
                    let localDay = utcDay.clone().add(utcOffset, 'minutes');
                    parseBeforeOffset(day, utcDay, localDay, offsetHours, currentDayData, yearlyAnomalyCounter, offsetMinutes, balanceHour);
                    if (Object.keys(currentDayData.dayData).length !== 0) {
                        let unsorted_summary = Object.keys(currentDayData.servers).map(
                            (key) => {
                                // serverList[key] = true;
                                return {
                                    name: key,
                                    value: currentDayData.servers[key],
                                };
                            }
                        );

                        currentDayData["summary"] = unsorted_summary.sort((a, b) => {
                            return b.value - a.value;
                        });
                        heatMapData.push({ ...currentDayData });
                    }
                    cleanCurrentDay(currentDayData);
                    parseAfterOffset(day, utcDay, localDay, offsetHours, currentDayData, yearlyAnomalyCounter, offsetMinutes, balanceHour);
                    // Checking if the following day in the list is not within a day's distance
                    // if so, we add the uncomplete day to our parsed list
                    if (Object.keys(currentDayData.dayData).length !== 0) {
                        if (tempBlobList[index + 1] !== undefined) {
                            // console.log("Distance in days", tempBlobList[index + 1].date - day.date);
                            if (tempBlobList[index + 1].date - day.date > 1000000) {
                                let unsorted_summary = Object.keys(currentDayData.servers).map(
                                    (key) => {
                                        // serverList[key] = true;
                                        return {
                                            name: key,
                                            value: currentDayData.servers[key],
                                        };
                                    }
                                );

                                currentDayData["summary"] = unsorted_summary.sort((a, b) => {
                                    return b.value - a.value;
                                });
                                heatMapData.push({ ...currentDayData });
                                cleanCurrentDay(currentDayData);
                            }
                        } else {
                            let unsorted_summary = Object.keys(currentDayData.servers).map(
                                (key) => {
                                    // serverList[key] = true;
                                    return {
                                        name: key,
                                        value: currentDayData.servers[key],
                                    };
                                }
                            );

                            currentDayData["summary"] = unsorted_summary.sort((a, b) => {
                                return b.value - a.value;
                            });
                            heatMapData.push({ ...currentDayData });
                            cleanCurrentDay(currentDayData);
                        }
                    }
                });
            } else {
                tempBlobList.forEach((day, index) => {
                    day.date = moment.utc(day.date, "YYYY-MM-DD HH:mm:ss");
                    let unsorted_summary = Object.keys(day.servers).map((key) => {
                        // serverList[key] = true;
                        return {
                            name: key,
                            value:
                                day.servers[key].total !== undefined
                                    ? day.servers[key].total
                                    : day.servers[key],
                        };
                    });

                    day.summary = unsorted_summary.sort((a, b) => {
                        return b.value - a.value;
                    });

                    yearlyAnomalyCounter["Total"] += day.total;
                    yearlyAnomalyCounter["Negative"] += day.total_negative !== undefined ? day.total_negative : 0;
                    yearlyAnomalyCounter["Positive"] += day.total_positive !== undefined ? day.total_positive : 0;
                    yearlyAnomalyCounter["Snoozed"] += day.total_snoozed !== undefined ? day.total_snoozed : 0;
                    yearlyAnomalyCounter["No Feedback"] += day.total_no_feedback !== undefined ? Object.keys(day.total_no_feedback).length : 0;
                    heatMapData.push(day);
                })
            }

            // return {
            //     serverNames: Object.keys(serverList).map((serverKey) => {
            //         return serverKey;
            //     }).sort(),
            //     anomaliesCounter: anomalyCounter,
            //     heatMapData: heatMapData,
            // }
            console.log("Final heatmapData", heatMapData);
            setParsedData({ yearlyAnomalyCounter: yearlyAnomalyCounter, heatMapData: heatMapData });
        }
    }, [blobList]);

    const onChangeTimestamp = (value) => {
        console.log("Changing selected time", value);
        setTimeStamp(value);
    }


    return (
        <>
            <Grid2 container sx={{ justifyContent: "center", alignItems: "center", width: "95%" }} direction="column">
                <Grid2 container sx={{ justifyContent: "center", alignItems: "center" }} direction="row">
                    {yearRange !== null ? (
                        <>
                            <FormControl sx={{ m: 1, minWidth: 200, maxWidth: 400, width: "30%" }} size="small" >
                                <InputLabel id="year-selector-label">Year</InputLabel>
                                <Select
                                    labelId="year-selector-label"
                                    id="year-selector"
                                    value={selectedYear}
                                    label="Year"
                                    onChange={(event) => setSelectedYear(event.target.value)}
                                >
                                    {yearRange.map((key, index) => {
                                        return (
                                            <MenuItem key={index} value={key}>
                                                {key}
                                            </MenuItem>)
                                    })}
                                </Select>
                                <FormHelperText>Select the TimeFrame</FormHelperText>
                            </FormControl>
                            <FormControl sx={{ m: 1, minWidth: 200, maxWidth: 400, width: "30%" }} size="small" >
                                <InputLabel id="demo-simple-select-helper-label">Timeframe</InputLabel>
                                <Select
                                    labelId="demo-simple-select-helper-label"
                                    id="demo-simple-select-helper"
                                    value={timeStamp}
                                    label="Time frame"
                                    onChange={(event) => onChangeTimestamp(event.target.value)}
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
                        </>
                    ) : (
                        <>
                            <Skeleton variant="rounded" width={200} height={60} />
                            <Skeleton variant="rounded" width={200} height={60} />
                        </>
                    )}
                </Grid2>
                <HeatMapSection time={timeStamp} data={parsedData}/>
                {/* <OverviewCardsSection time={timeStamp} timeStampOptions={timeStampOptions} blobList={blobList}/> */}
            </Grid2>
        </>
    );
};
