import React, { useState } from "react";
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import DownloadCSV from "../../common/DownloadCSV";
import FilterListIcon from '@mui/icons-material/FilterList';
import Tooltip from '@mui/material/Tooltip';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';

function EnhancedTableToolbar(props) {
  const [loading, setLoading] = useState(false);

  const downloadMediator = async () => {
      setLoading(true);
      const tempData = await props.handleDownload();
      console.log("Temp data", tempData);
      setLoading(false);
      return tempData;
  }

  return (
      <Toolbar
          sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              backgroundColor: "#6aa0f7"
          }}
      >
          <Typography
              sx={{ flex: '1 1 100%', color: "white" }}
              variant="h6"
              id="tableTitle"
              component="div"
          >
              {props.title}
          </Typography>
          <Tooltip title="Filter table">
              <IconButton onClick={(e) => { props.handleHideOptions() }}>
                  <FilterListIcon sx={{ color: props.filterOptions && "#000000" }} />
              </IconButton>
          </Tooltip>
          <DownloadCSV handleOnClick={downloadMediator} mode={props.title}/>
          {loading && (
              <div>
                  <CircularProgress color="secondary" />
              </div>
          )}
      </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  handleDownload: PropTypes.func.isRequired,
  handleHideOptions: PropTypes.func.isRequired,
  filterOptions: PropTypes.bool.isRequired,
};

export default EnhancedTableToolbar;
