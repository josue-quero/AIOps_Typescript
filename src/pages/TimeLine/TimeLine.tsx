import React, { useRef } from "react";
import Typography from "@mui/material/Typography";
import Fade from '@mui/material/Fade';
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import TimelineIcon from '@mui/icons-material/Timeline';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import MetricSearchSection from "./components/MetricsSearchSection";
import useSnapshot from '../../hooks/useSnapshot';
import moment from 'moment-timezone';
import CircularProgress from '@mui/material/CircularProgress';
import { where } from 'firebase/firestore';

function TimeLine() {
    const limitDate = moment().subtract(1, 'months').startOf('year').utc().format('YYYYMMDD');
    const limitDateNumber = parseInt(limitDate, 10) * 1000000;
    const isBlobListReady = useRef(true);
    const { blobList, listError, loadingList } = useSnapshot(isBlobListReady, null, where('date', '>=', limitDateNumber));
    return (
        <Fade in={true} {...({ timeout: 1000 })}>
            <Grid2 container sx={{ alignItems: "center" }} direction="column">
                <Box sx={{ display: "flex", alignItems: "center", marginY: 2 }}>
                    <TimelineIcon sx={{ fontSize: "2rem", marginRight: 1, color: "#6aa0f7" }} />
                    <Typography variant="h5" component="h5">
                        Anomaly Visualizer
                    </Typography>
                </Box>
                <Grid2 container sx={{ justifyContent: "center", alignItems: "center", width: "95%" }} direction="column">
                    <Box sx={{ width: "100%", marginBottom: 2, height: "100%" }}>
                        <Paper elevation={3} sx={{ width: "100%", height: "100%", padding: 2 }}>
                            {blobList !== null ? (
                                <MetricSearchSection blobList={blobList} />
                            ) : (
                                <Grid2 container sx={{justifyContent: "center", alignItems: "cewnter"}}>
                                     <CircularProgress />
                                </Grid2>
                            )}
                        </Paper>
                    </Box>
                </Grid2>
            </Grid2>
        </Fade>
    );
}

export default TimeLine;