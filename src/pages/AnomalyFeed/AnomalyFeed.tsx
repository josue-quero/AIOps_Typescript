import { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import NearbyErrorIcon from '@mui/icons-material/NearbyError';
import AnomalyDetails from './components/AnomalyDetails';
import CircularProgress from '@mui/material/CircularProgress';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import { TransitionGroup } from 'react-transition-group';
import Collapse from '@mui/material/Collapse';
import { OneHourData } from 'hooks/useGetAnomalies';

type AnomalyFeedProps = {
  anomalies: OneHourData[] | null;
  resetChanges: () => void;
  user: string;
}

const AnomalyFeed = (props: AnomalyFeedProps) => {
  const [anomalyIdx, setAnomalyIdx] = useState(-1);

  const handleClick = (anomalyIdx: number) => {
    setAnomalyIdx(anomalyIdx);
  };

  useEffect(() => {
    console.log("Resetting changes from timeline");
    props.resetChanges();
  }, [props.anomalies]);

  return (
    <div>
      {props.anomalies !== null ? (
        <Fade in={true} {...({ timeout: 1000 })}>
          <Box sx={{ display: 'flex', overflow: 'hidden' }}>
            {props.anomalies.length > 0 ? (<>
              <List
                sx={{
                  width: '100%',
                  maxWidth: 240,
                  height: '100vh',
                  overflow: 'auto',
                }}
              >
                <TransitionGroup>
                  {props.anomalies.map((anomaly, idx) => {
                    let isSelected = false;
                    if (anomaly && anomalyIdx !== -1 && props.anomalies !== null) {
                      isSelected = anomaly.docId === props.anomalies[anomalyIdx].docId;
                    }
                    return (
                      <Collapse key={anomaly.docId}>
                        <ListItemButton
                          key={anomaly.docId}
                          onClick={() => handleClick(idx)}
                          selected={isSelected}
                          sx={{ ...(idx === 0 ? { borderTop: "1px solid #808080", borderBottom: "1px solid #808080" } : { borderBottom: "1px solid #808080" }), ...(anomaly.feedback !== undefined ? anomaly.feedback[props.user as keyof typeof anomaly.feedback] !== undefined ? {} : { borderLeft: '4px solid #6aa0f7' } : { borderLeft: '4px solid #6aa0f7' }) }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <NearbyErrorIcon />
                            </Avatar>
                          </ListItemAvatar>
                          {anomaly.feedback !== undefined ? (<>
                            {
                              anomaly.feedback[props.user as keyof typeof anomaly.feedback] !== undefined ? (
                                <ListItemText
                                  primary={anomaly.Server_ID}
                                  secondary={anomaly.anomalyType}
                                />
                              ) : (
                                <ListItemText
                                  primary={anomaly.Server_ID}
                                  secondary={anomaly.anomalyType}
                                  primaryTypographyProps={{
                                    fontWeight: "bold"
                                  }}
                                  secondaryTypographyProps={{
                                    color: "primary"
                                  }}
                                />
                              )
                            }
                          </>
                          ) : (
                            <ListItemText
                              primary={anomaly.Server_ID}
                              secondary={anomaly.anomalyType}
                              primaryTypographyProps={{
                                fontWeight: "bold"
                              }}
                              secondaryTypographyProps={{
                                color: "primary"
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Collapse>
                    );
                  })}
                </TransitionGroup>
              </List>
              {anomalyIdx > -1 && (
                <AnomalyDetails anomaly={props.anomalies[anomalyIdx]} user={props.user} />
              )}
            </>
            ) : (
              <Grid2 container sx={{ width: "100%", height: "100vh", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="h4" sx={{ alignContent: "center" }}>
                  No anomalies found
                </Typography>
              </Grid2>
            )}
          </Box>
        </Fade>
      ) : (
        <Grid2
          container
          sx={{ width: '100%', maxWidth: 220, justifyContent: 'center' }}
        >
          <CircularProgress />
        </Grid2>
      )}
    </div>
  );
};

export default AnomalyFeed;
