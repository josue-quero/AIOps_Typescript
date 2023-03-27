import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DataGrid } from '@mui/x-data-grid';

const columns = [
    { field: 'id', headerName: 'ID', minWidth: 180, flex: 1 },
    { field: 'y', headerName: 'Value', type: 'number', minWidth: 60, flex: 1 },
    { field: 'x', headerName: 'Date', type: 'date', minWidth: 265, flex: 1 },
    { field: 'status', headerName: 'Status', minWidth: 60, flex: 1 },
    { field: 'anomaly', headerName: 'Anomaly', minWidth: 60, flex: 1 },
    { field: 'importance', headerName: 'Importance', minWidth: 90, flex: 1 },
  ];

const AnomaliesTable = (data) => {
    console.log("table data", data.data);
    return (
        <div>
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Typography>{"Anomalies Table " + "(Total anomalies: " + data.data.length + ")"}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                <div style={{ height: 300, width: '100%' }}>
                    <DataGrid
                        rows={data.data}
                        columns={columns}
                        checkboxSelection
                        hideFooterPagination
                        Pagination={false}
                    />
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
    );
};

export default AnomaliesTable;