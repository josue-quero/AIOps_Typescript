import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, getDocs, startAfter, endBefore, limit, limitToLast, getCountFromServer, where } from "firebase/firestore";
import { firestore } from '../../firebase/order-food';
import Fade from "@mui/material/Fade";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import FeedbackIcon from '@mui/icons-material/Feedback';
import Typography from "@mui/material/Typography";
import moment from "moment-timezone";
import TableViewIcon from '@mui/icons-material/TableView';
import AnomaliesTable from './AnomaliesTable';

export default function Alerts() {
    const docsPerQuery = 30;
    const [filters, setFilters] = useState('None');
    const [rows, setRows] = useState(null);
    const [currentStart, setCurrentStart] = useState(0);
    const [continuationToken, setContinuationToken] = useState('None');
    const [disableNextButton, setDisableNextButton] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const getTableAlerts = async () => {
        console.log("Current filters", filters);
        setIsLoading(true);
        setCurrentStart((prev) => prev + docsPerQuery);
        console.log("Continuation Token", continuationToken);
        await fetch('/getTableAlerts', {
            method: 'POST',
            body: JSON.stringify({
                maxValues: docsPerQuery,
                token: continuationToken,
                filters: filters,
                timezone: moment.tz.guess(true),
            }),
            headers: {
                'Content-type': 'application/json',
            }
        })
            .then((response) => {
                if (!response.ok) {
                    return response.text().then((text) => {
                        console.log("Text error");
                        console.log(text);
                        throw new Error(text);
                    });
                } else {
                    return response.json();
                }
            })
            .then((data) => {
                console.log("Recovered data", data);
                const totalRows = data.result;
                
                if (rows === null || currentStart === 0) {
                    setRows(totalRows);
                } else {
                    let tempPrevRow = [...rows];
                    setRows(tempPrevRow.concat(totalRows));
                }
                setIsLoading(false);
                console.log("New token", data.continuationToken);
                if (data.continuationToken === undefined) {
                    setContinuationToken('None');
                    setDisableNextButton(true);
                } else {
                    setContinuationToken(data.continuationToken);
                }
                console.log("Rows", totalRows);
            })
            .catch((err) => {
                console.log(err);
                setIsLoading(false);
            });
    }

    useEffect(() => {
        console.log("UseEffect for calling table alerts");
        getTableAlerts();
    }, [filters]);

    const handleChangeFilter = (filters) => {
        console.log("Changing column filters");
        setDisableNextButton(false);
        setContinuationToken('None');
        setCurrentStart(0);
        let tempFilters = '';
        for (let i = 0; i < filters.length; i++) {
            console.log("Condition number ", filters[i].Field, filters[i].Operation, filters[i].Value);
            tempFilters += filters[i].Field + " " + filters[i].Operation + "'" + filters[i].Value + "'";
            if (i !== filters.length - 1) {
                tempFilters += " " + filters[i + 1].boolOp + " ";
            }
        } 
        console.log("New conditions from advanced filter change", tempFilters);
        setFilters(tempFilters);
    }

    const clearFilters = () => {
        setDisableNextButton(false);
        setContinuationToken('None');
        setCurrentStart(0);
        setFilters('None');
    }

    const handleDownloadAll = async () => {
        let resultData = [];
        await fetch('/getTableAlerts', {
            method: 'POST',
            body: JSON.stringify({
                maxValues: -1,
                token: 'None',
                filters: filters,
                timezone: moment.tz.guess(true),
            }),
            headers: {
                'Content-type': 'application/json',
            }
        })
            .then((response) => {
                if (!response.ok) {
                    return response.text().then((text) => {
                        console.log("Text error");
                        console.log(text);
                        throw new Error(text);
                    });
                } else {
                    return response.json();
                }
            })
            .then((data) => {
                console.log("Downloaded data", data.result);
                resultData = data.result;
            })
            .catch((err) => {
                console.log(err);
            });
        return resultData;
    }

    return (
        <>
            <Fade in={true} {...({ timeout: 1000 })}>
                <Grid2 container sx={{ alignItems: "center", width: "100%", height: "100%" }} direction="column">
                    <Box sx={{ display: "flex", alignItems: "center", marginY: 2 }}>
                        <TableViewIcon sx={{ fontSize: "2rem", marginRight: 1, color: "#6aa0f7" }} />
                        <Typography variant="h5" component="h5">
                            Alerts Table
                        </Typography>
                    </Box>
                    {(rows !== null) ? (
                        <Fade in={true} {...{ timeout: 1000 }}>
                            <Grid2 sx={{ paddingBottom: 2, paddingX: 2, width: "100%", height: "100%" }}>
                                <AnomaliesTable
                                    rows={rows}
                                    isLoading={isLoading}
                                    start={currentStart}
                                    docsPerQuery={docsPerQuery}
                                    onNextPage={getTableAlerts}
                                    disableNextButton={disableNextButton}
                                    onAdvancedFilter={handleChangeFilter}
                                    clearFilters={clearFilters}
                                    handleDownloadAll={handleDownloadAll}
                                />
                            </Grid2>
                        </Fade >
                    ) : (
                        <Grid2
                            container
                            sx={{ width: '100%', justifyContent: 'center' }}
                        >
                            <CircularProgress />
                        </Grid2>
                    )
                    }
                </Grid2>
            </Fade>
        </>
    );
}