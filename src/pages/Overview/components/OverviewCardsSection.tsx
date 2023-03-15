import React, { useState, useEffect } from 'react';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import moment from 'moment-timezone';
import AnomaliesCard from '../../TimeLine/components/AnomaliesCard';
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";

export default function OverviewCardsSection({ time, timeStampOptions, blobList }) {
    const [loadingServers, setLoadingServers] = useState(false);
    const [anomaliesCounter, setAnomaliesCounter] = useState(null);

    useEffect(() => {
        function getAnomaliesCounter(blobList, time) {
            setLoadingServers(true);
            if (time === "year") {
                setLoadingServers(false);
                setAnomaliesCounter({ data: blobList.anomaliesCounter, time: timeStampOptions[time] });
            } else {
                const limitDate = moment().startOf(time);
                let anomalyCounter = {
                    "Total": 0,
                    "Negative": 0,
                    "Positive": 0,
                    "Snoozed": 0,
                    "No Feedback": 0,
                }
                blobList.heatMapData.forEach((day) => {
                    // First day retreived check
                    if (day.date.isSame(limitDate) || day.date.isAfter(limitDate)) {
                        anomalyCounter["Total"] += day.total;
                        anomalyCounter["Negative"] += day.total_negative !== undefined ? day.total_negative : 0;
                        anomalyCounter["Positive"] += day.total_positive !== undefined ? day.total_positive : 0;
                        anomalyCounter["Snoozed"] += day.total_snoozed !== undefined ? day.total_snoozed : 0;
                    }
                })
                anomalyCounter["No Feedback"] += anomalyCounter["Total"] - (anomalyCounter["Positive"] + anomalyCounter["Negative"] + anomalyCounter["Snoozed"]);
                console.log("Anomaly counter", anomalyCounter);
                setAnomaliesCounter({ data: anomalyCounter, time: timeStampOptions[time] });
                setLoadingServers(false);
            }
        }
        if (blobList) {
            console.log("setting serverList", blobList);
            getAnomaliesCounter(blobList, time);
        }
    }, [time, blobList, timeStampOptions])

    return (
        <Box sx={{ width: "100%", marginBottom: 2, height: "100%" }}>
            <Paper elevation={3} sx={{ width: "100%", height: "100%", padding: 2 }}>
                {anomaliesCounter && (
                    <Grow in={anomaliesCounter !== null} style={{ transformOrigin: '0 0 0' }} {...({ timeout: 1000 })}>
                        <Grid2 container sx={{ justifyContent: "center", width: "100%", alignItems: "center" }}>
                            <AnomaliesCard anomaliesCounter={anomaliesCounter} loading={loadingServers} />
                        </Grid2>
                    </Grow>
                )}
            </Paper>
        </Box>
    )
}
