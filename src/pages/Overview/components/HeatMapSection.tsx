import React, { useState, useEffect } from "react";
import Skeleton from '@mui/material/Skeleton';
import Fade from '@mui/material/Fade';
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import CalendarHeatmap from "./CalendarHeatmap";

export default function HeatMapSection({time, data}) {
    // console.log("Time heatmap", time);
    // console.log("Data in heatmapsection", data);

    useEffect(() => {
        console.log("Updated time overview", time);
    }, [time]);

    // const CalendarMemo = React.memo(CalendarHeatmap);

    return (
        <>
            {data !== null ? (
                <Fade in={data.heatMapData.length > 0} {...({ timeout: 1000 })}>
                    <Grid2 container style={{ justifyContent: "center" }}>
                        <CalendarHeatmap
                            data={data.heatMapData}
                            color={"#2074d4"}
                            overview={time}>
                        </CalendarHeatmap>
                    </Grid2>
                </Fade>
            ) : (
                <Grid2 container style={{ justifyContent: "center" }}>
                    <Skeleton variant="rectangular" width={1000} height={500} />
                </Grid2>
            )}
        </>
    )
}
