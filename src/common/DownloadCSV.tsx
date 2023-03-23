import React, { useRef, useState, useEffect } from 'react';
import SimCardDownloadIcon from '@mui/icons-material/SimCardDownload';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import moment from 'moment-timezone';
import { CSVLink } from "react-csv";

const headersFeedback = [
    { label: "Anomaly ID", key: "anomalyID" },
    { label: "Server", key: "server" },
    { label: "Metric", key: "metric" },
    { label: "Timestamp", key: "timestamp" },
    { label: "Value", key: "value" },
    { label: "User", key: "user" },
    { label: "Feedback", key: "feedback" }
];

const headersAlerts = [
    { label: "Alert ID", key: "partitionKey" },
    { label: "Timestamp", key: "timestamp" },
    { label: "Description", key: "description" },
    { label: "Metric", key: "metric" },
    { label: "Status", key: "status" },
]

function DownloadCSV(props) {
    const [data, setData] = useState([]);
    const csvLinkEl = useRef();

    const downloadReport = async () => {
        let tempData = await props.handleOnClick();
        console.log("TempData", tempData);
        setData(tempData);
    };

    useEffect(() => {
        if (data.length > 0) {
            console.log("Using effect download csv");
            setTimeout(() => {
                csvLinkEl.current.link.click();
            });
        }
    }, [data])

    return (
        <Tooltip title="Download table">
            <div>
                <IconButton onClick={() => downloadReport()}>
                    <SimCardDownloadIcon />
                </IconButton>
                <CSVLink
                    headers={props.mode === "Feedback" ? headersFeedback : headersAlerts}
                    filename={props.mode + "_Report_" + moment().format('YYYY_MM_DD_HH_mm') + ".csv"}
                    data={data}
                    ref={csvLinkEl} />
            </div>
        </Tooltip>
    );
}

export default DownloadCSV;