import React from "react";
import { Typography } from "@mui/material";
import Fade from "@mui/material/Fade";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import PreviewIcon from "@mui/icons-material/Preview";
import Box from "@mui/material/Box";
import OverviewGraphs from "components/OverviewGraphs";

export default function Overview({topics}) {

  return (
    <>
      <Fade in={true} {...{ timeout: 1000 }}>
        <Grid2 container sx={{ alignItems: "center" }} direction="column">
          <Box sx={{ display: "flex", alignItems: "center", marginY: 2 }}>
            <PreviewIcon
              sx={{ fontSize: "2rem", marginRight: 1, color: "#6aa0f7" }}
            />
            <Typography variant="h5" component="h5">
              Overview
            </Typography>
          </Box>
          <OverviewGraphs topics={topics} />
        </Grid2>
      </Fade>
    </>
  );
}
