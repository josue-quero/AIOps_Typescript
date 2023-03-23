import React, { useState } from "react";
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import DownloadCSV from "common/DownloadCSV";
import FilterListIcon from '@mui/icons-material/FilterList';
import Tooltip from '@mui/material/Tooltip';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import { ExcelRow } from "pages/Feedback/Feedback";

type Row = {
    partitionKey: string;
    timestamp: string;
    description: string;
    status: string;
    metric: string;
    value: number;
    eventType: string;
  }

type EnhancedToolbarProps = {
    filterOptions: boolean;
    handleHideOptions: () => void;
    handleDownload: () => Promise<ExcelRow[]> | Promise<Row[]>;
    title: string;
}

function EnhancedTableToolbar(props: EnhancedToolbarProps) {
  const [loading, setLoading] = useState(false);

  const downloadMediator = async () => {
      setLoading(true);
      const tempData = await props.handleDownload();
      console.log("Temp data", tempData);
      setLoading(false);
      return tempData;
  }

  // NOTE: could not work, original is props.filterOptions && "#000000"
  const filterListStyle = {
    color: props.filterOptions ? "#000000" : ""
  };

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
                  <FilterListIcon sx={{ filterListStyle }} />
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
