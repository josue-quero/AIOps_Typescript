import { useState, useEffect } from 'react';
import {
  Button,
} from '@mui/material';
import ButtonGroup from '@mui/material/ButtonGroup';
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import { Typography } from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  Snooze as SnoozeIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import notFound from '../../../assets/icon.png';
import moment from 'moment';
import MainPageGraph from '../../../common/GraphCommon';
import { firestore } from '../../../firebase/order-food';
import Divider from '@mui/material/Divider';

const statusColor = {
  '-1': '#f7584d',
  0: '#f5ce64',
  1: '#007500',
  2: '#808080',
};

const dataNotFound = (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      fontSize: 32,
      fontWeight: 'bold',
      color: '#332f2e',
    }}
  >
    <img src={notFound} style={{ width: 200, aspectRatio: 1 }} alt={"Not found"}/>
    <p style={{ margin: 0 }}>No Data Found</p>
  </div>
);

const AnomalyDetails = ({ anomaly, user }) => {
  const oneHourData = anomaly.one_hour_data;
  const status = anomaly.status;
  const timeStr = moment.unix(anomaly.Timestamp.seconds).format('LLLL');
  const hasClient = anomaly.Client_Name !== undefined;
  const [isEnabled, setIsEnabled] = useState(true);


  useEffect(() => {
    if (anomaly.feedback) {
      console.log(anomaly.feedback[user]);
      if (anomaly.feedback[user]) {
        const enabled = Math.abs(parseInt(anomaly.feedback[user])) !== 1;
        console.log('calc', enabled);
        setIsEnabled(enabled);
      } else {
        setIsEnabled(true);
      }
    } else {
      setIsEnabled(true);
    }
  }, [anomaly, user]);

  let hourData = [];
  let pointColors = [];
  let indexLines = [];

  if (oneHourData) {
    hourData = oneHourData.map((item, idx) => {
      if (item.Anomaly) {
        indexLines.push(idx);
        pointColors.push(statusColor[status === null ? 2 : status]);
      } else {
        pointColors.push('rgba(106,160,247,0.7)');
      }
      return {
        x: moment(item.Date.seconds * 1000),
        y: item.Value,
        status: status === null ? 2 : status,
      };
    });
  }

  const data = {
    datasets: [
      {
        data: hourData,
        label: anomaly.anomalyType,
        borderColor: '#3e95cd',
        fill: false,
        pointBackgroundColor: pointColors,
        lineAtIndex: indexLines,
      },
    ],
  };

  const handleSubmitFeedback = async (event) => {
    console.log(event.target.value);
    const docRef = doc(firestore, 'aiops', anomaly.docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      let feedback = {};
      if (data.feedback) {
        feedback = data.feedback;
      }
      const newFeedback = {
        ...feedback,
      };
      newFeedback[user] = parseInt(event.target.value);
      console.log(newFeedback);
      await updateDoc(docRef, {
        feedback: newFeedback,
      });
    } else {
      console.log('No such document!');
    }
  };

  return (
    <div style={{ flexGrow: 1, padding: 24, height: "100%" }}>
      <Grid2 justifyContent="space-between" container direction="row" sx={{ width: "100%" }}>
        <Grid2>
          <Typography variant="h5" display="inline">{anomaly.Server_ID}: </Typography>
          <Typography variant="h6" display="inline" color="#5A5A5A">{anomaly.anomalyType}</Typography>
        </Grid2>
        <Grid2 container sx={{ alignItems: "end" }}>
          <Typography variant="h6" display="inline" color="#5A5A5A">{timeStr}</Typography>
        </Grid2>
      </Grid2>
      <Divider />
      <Grid2 container direction="column" sx={{ width: '100%', height: "100%", alignItems: "center" }} justifyContent="space-around">
        <Grid2 sx={{ display: 'flex', justifyContent: 'center', flexGrow: 1, width: "90%", height: "100%" }}>
          {oneHourData && (
            <MainPageGraph tableData={[]} metricName={anomaly.anomalyType} data={data} unit='minute' aspectRatio={true} detailsMode={false} serverName={anomaly.Server_ID} />
          )}
          {!oneHourData && (dataNotFound)}
        </Grid2>
        <Grid2 container direction="row" justifyContent="space-between" sx={{ alignItems: 'center', width: "90%", marginTop: 1 }}>
          <Grid2>
            {hasClient && (
              <>
                <Typography display="inline" sx={{ fontWeight: 'bold', paddingRight: 0.5 }} variant="body1">
                  {"Client: "}
                </Typography>
                <Typography display="inline" variant="body1">
                  {anomaly.Client_Name}
                </Typography>
              </>
            )}
          </Grid2>
          <Grid2 container direction="column" sx={{ backgroundColor: "#6aa0f7", alignItems: "center", padding: 1, borderRadius: 1, overflow: "auto" }}>
            <Grid2>
              <Typography variant="subtitle2">Feedback</Typography>
            </Grid2>
            <Grid2 >
              <ButtonGroup color="success" size="small">
                <Button
                  variant='outlined'
                  startIcon={<ThumbUpIcon />}
                  onClick={handleSubmitFeedback}
                  value={1}
                  disabled={!isEnabled}
                  sx={{ color: '#000000' }}
                >
                  Helpful
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<ThumbDownIcon />}
                  onClick={handleSubmitFeedback}
                  value={-1}
                  disabled={!isEnabled}
                  sx={{ color: '#000000' }}
                >
                  Not Helpful
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<SnoozeIcon />}
                  onClick={handleSubmitFeedback}
                  value={0}
                  disabled={!isEnabled}
                  sx={{ color: '#000000' }}
                >
                  Snooze
                </Button>
              </ButtonGroup>
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>
    </div>
  );
};

export default AnomalyDetails;
