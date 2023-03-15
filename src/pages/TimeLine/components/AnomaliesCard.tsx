import React from "react";
import Card from "@mui/material/Card";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import NotificationsPausedIcon from "@mui/icons-material/NotificationsPaused";
import RadioButtonUncheckedOutlinedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
import Fade from "@mui/material/Fade";

function AnomaliesCard(props) {
  const timeStampOptions = {
    1: "Last Hour",
    6: "Last 6 Hours",
    24: "Last 24 hours",
    168: "Last Week",
  };

  const icons = {
    Total: null,
    Positive: <ThumbUpAltIcon sx={{ color: "#007500" }} />,
    Negative: <ThumbDownAltIcon sx={{ color: "#f7584d" }} />,
    Snoozed: <NotificationsPausedIcon sx={{ color: "#f5ce64" }} />,
    "No Feedback": (
      <RadioButtonUncheckedOutlinedIcon sx={{ color: "#808080" }} />
    ),
  };

  return (
    <Grid2
      container
      sx={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 2,
      }}
      direction="row"
      rowSpacing={2}
      columnSpacing={{ xs: 1, sm: 2 }}
    >
      {Object.keys(props.anomaliesCounter.data).map((key, index) => {
        return (
          <Grid2 key={index}>
            <Card sx={{ minWidth: 180, minHeight: 40, borderRadius: 5}}>
              <Fade in={!props.loading} {...{ timeout: 500 }}>
                <CardContent sx={{"&:last-child": {
      paddingBottom: "16px"
    }}}>
                  <Grid2
                    container
                    sx={{ alignItems: "center" }}
                    direction="column"
                  >
                    {props.serverName && (
                      <Grid2 sx={{marginY: 0, paddingY: 0}}>
                        <Typography
                          sx={{ fontSize: 12, textAlign: "center" }}
                          color="subtitle2"
                        >
                          Anomalies in {props.serverName}
                        </Typography>
                      </Grid2>
                    )}
                    <Grid2>
                      <Typography
                        sx={{ fontSize: 10, textAlign: "center" }}
                        color="text.secondary"
                        gutterBottom
                      >
                        {key} Anomalies in{" "}
                        {
                          timeStampOptions[
                            parseInt(props.anomaliesCounter.time)
                          ]
                        }
                      </Typography>
                    </Grid2>
                    <Grid2
                      container
                      sx={{ justifyContent: "center", alignItems: "center" }}
                      spacing={2}
                    >
                        <Grid2>
                          <Typography
                            variant="h5"
                            component="div"
                            sx={{ textAlign: "center" }}
                          >
                            {props.anomaliesCounter.data[key]}
                          </Typography>
                        </Grid2>
                      {icons[key] && icons[key]}
                    </Grid2>
                    {props.anomaliesCounter.lastWeek && (
                      <Grid2 sx={{marginY: 0, paddingY: 0}}>
                      <Typography
                        sx={{ fontSize: 10, textAlign: "center", margin: 0 }}
                        color="text.secondary"
                        gutterBottom
                      >
                        {(props.anomaliesCounter.lastWeek[key] === props.anomaliesCounter.data[key]) ? (
                          "= equal to last week"
                        ) : (
                          props.anomaliesCounter.lastWeek[key] + " last week"
                        )}
                      </Typography>
                    </Grid2>
                    )}
                  </Grid2>
                </CardContent>
              </Fade>
            </Card>
          </Grid2>
        );
      })}
    </Grid2>
  );
}

export default AnomaliesCard;
