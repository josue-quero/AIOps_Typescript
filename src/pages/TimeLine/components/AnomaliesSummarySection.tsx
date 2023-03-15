import React from "react";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import Grow from '@mui/material/Grow';
import missingImage from "../../assets/icon.png";
import Typography from '@mui/material/Typography';
import AnomaliesCard from "./AnomaliesCard";
import Divider from '@mui/material/Divider';

function AnomaliesSummarySect(props) {
    console.log("anomalies counter", props.anomaliesCounter);
    console.log("Rendering anomaly summary section");
    return (
        <Grid2 container sx={{justifyContent: "center", alignItems: "center", width: "100%"}} direction="column">
            <Typography variant="h6" sx={{width: "100%", alignText: "left", marginBottom: 1}}>
                Summary
            </Typography>
            <Divider sx={{ width: "100%", marginBottom: 1}} />
            {props.anomaliesCounter ? (
            <Grow in={props.anomaliesCounter !== null} style={{ transformOrigin: '0 0 0' }} {...({ timeout: 1000 })}> 
                <Grid2 container sx={{ justifyContent: "center", width: "100%", alignItems: "center" }}>
                    <AnomaliesCard anomaliesCounter={props.anomaliesCounter} loading={props.loadingServers}/>
                </Grid2>
            </Grow>
            ) : (
                <Grid2 container sx={{ justifyContent: "center", width: "100%", alignItems: "center" }} direction="column">
                    <img src={missingImage} alt="My SVG" style={{ width: "5%", height: "5%", paddingTop: "20px" }} />
                    <Typography variant="p1">No anomalies found</Typography>
                </Grid2>
            )}
        </Grid2>
    );
}

export default AnomaliesSummarySect;