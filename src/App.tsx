import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import PrivateRoute from './components/PrivateRoute';
import 'chartjs-adapter-moment';
import React, { useRef, useState } from 'react';
import useGetAnomalies from './hooks/useGetAnomalies';
import zoomPlugin from 'chartjs-plugin-zoom';
import TimeLine from 'pages/TimeLine/TimeLine';
import Layout from './common/Layout';
import Alerts from './pages/Alerts/Alerts';
import AnomalyFeed from './pages/AnomalyFeed/AnomalyFeed';
import Overview from './pages/Overview/Overview';
import moment from 'moment-timezone';
import Login from './pages/Login/Login';
import SignIn from './pages/Login/SignIn';
import ResetPassword from './pages/Login/ResetPassword';
import { useAuthContext } from './hooks/useAuthContext';
import { useSnackbar } from 'notistack';
import {
  Chart as ChartJS,
  CategoryScale,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Feedback from './pages/Feedback/Feedback';

const noDataPlugin = {
  id: 'custom_message_drawer',
  afterDraw: function (chart: {
    data: {
      datasets: {
        label: any; data: any;
      }[];
    }; ctx: any; width: any; height: any; clear: () => void;
  }) {
    if (chart.data.datasets[0].data.length === 0) {
      // No data is present
      var ctx = chart.ctx;
      var width = chart.width;
      var height = chart.height;
      chart.clear();
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "16px normal 'Helvetica Nueue'";
      const tempTitle = chart.data.datasets[0].label;
      ctx.fillText(tempTitle, width / 2, 18); // <====   ADDS TITLE
      ctx.fillText('No data found', width / 2, height / 2);
      ctx.restore();
    } else if (typeof chart.data.datasets[0].data === 'string' || chart.data.datasets[0].data instanceof String) {
      var ctx = chart.ctx;
      var width = chart.width;
      var height = chart.height;
      chart.clear();
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "16px normal 'Helvetica Nueue'";
      const tempTitle = chart.data.datasets[0].label;
      ctx.fillText(tempTitle, width / 2, 18); // <====   ADDS TITLE
      ctx.fillText(chart.data.datasets[0].data, width / 2, height / 2);
      ctx.restore();
    }
  },
};

ChartJS.register(
  CategoryScale,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  noDataPlugin,
  Filler,
);

type PrivateRouteProps = {
  redirect: string;
  outlet: JSX.Element;
};

const PrivateRoute = ({ redirect, outlet }: PrivateRouteProps) => {
  const { user } = useAuthContext();
  return user ? outlet : <Navigate to={{ pathname: redirect }} />;
};

function App() {
  const { enqueueSnackbar } = useSnackbar();
  const { user, authIsReady } = useAuthContext();
  const [lastAnomaly, setLastAnomaly] = useState<moment.Moment | null>(null);
  const isAnomaliesReady = useRef(true);

  const handleSetLastAnomaly = (value: moment.Moment): void => {
    setLastAnomaly(value);
  };

  const handleNewAnomaly = () => {
    enqueueSnackbar('New anomally detected!', { variant: "warning" });
  };

  // console.log("Limit date number", limitDateNumber);
  const [anomalies, initialCount, setInitialCount, topics, updateLastAnomaly ] = useGetAnomalies(isAnomaliesReady, null, lastAnomaly, user, handleSetLastAnomaly, handleNewAnomaly);

  const resetChanges = () => {
    console.log("Resetting changes");
    const newDate = moment();
    updateLastAnomaly(newDate);
    setLastAnomaly(newDate);
    setInitialCount(0);
  };

  if (!authIsReady) {
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/login'
          element={!user ? <Login /> : <Navigate to='/overview' />}
        />
        <Route
          path='signin'
          element={!user ? <SignIn /> : <Navigate to='/overview' />}
        />
        <Route path='reset-password' element={<ResetPassword />} />
        <Route path='/' element={<Layout changes={initialCount} />}>
          <Route
            path='overview'
            element={
              user ? <Overview topics={topics} /> : <Navigate to='/' />
            }
          />
          <Route
            path='alerts'
            element={user ? <Alerts /> : <Navigate to='/' />}
          />
          <Route
            path='timeline'
            element={
              user ? <TimeLine /> : <Navigate to='/' />
            }
          />
          <Route
            path='feedback'
            element={
              user ? <Feedback topics={topics} /> : <Navigate to='/' />
            }
          />
          <Route
            path='notifications'
            element={
              user ? (
                <AnomalyFeed
                  anomalies={anomalies}
                  resetChanges={resetChanges}
                  user={user.email}
                />
              ) : (
                <Navigate to='/' />
              )
            }
          />
        </Route>
      </Routes>
    </BrowserRouter >
  );
}

export default App;
