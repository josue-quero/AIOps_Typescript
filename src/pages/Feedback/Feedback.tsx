import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, getDocs, startAfter, endBefore, limit, limitToLast, getCountFromServer, where } from "firebase/firestore";
import { firestore } from '../../firebase/order-food';
import Fade from "@mui/material/Fade";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import FeedbackTable from './components/FeedbackTable';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import FeedbackIcon from '@mui/icons-material/Feedback';
import Typography from "@mui/material/Typography";
import moment from "moment-timezone";

const feedbackColor = {
    1: ["#007500", "Positive"],
    "-1": ["#f7584d", "Negative"],
    0: ["#f5ce64", "Snoozed"],
};

export default function Feedback({ topics }) {
    const [feedback, setFeedback] = useState(null);
    const [collectionCount, setCollectionCount] = useState(null);
    const [lastDoc, setLastDoc] = useState('');
    const [firstDoc, setFirstDoc] = useState('');
    const [currentStart, setCurrentStart] = useState(0);
    const [loading, setLoading] = useState(false);
    const [conditions, setConditions] = useState([]);
    const [index, setIndex] = useState('Timestamp');
    const [order, setOrder] = useState('desc');
    const docsPerQuery = 30;
    console.log("Feedback rendering");


    const getNextFeedback = useCallback(async () => {
        setLoading(true);
        console.log("Getting next feedback: last doc ref", lastDoc);
        setCurrentStart((prev) => prev + docsPerQuery);
        let first;
        let countQuery;
        console.log("Conditions active?", conditions);
        if (lastDoc !== '') {
            first = query(collection(firestore, "aiops"), ...conditions, where("topic", "in", topics), orderBy(index, order), startAfter(lastDoc), limit(docsPerQuery));
        } else {
            console.log("First query");
            first = query(collection(firestore, "aiops"), ...conditions, where("topic", "in", topics), orderBy(index, order), limit(docsPerQuery));
        }
        countQuery = query(collection(firestore, "aiops"), ...conditions, where("topic", "in", topics));
        console.log("Count query", countQuery);
        const allDocs = await getCountFromServer(countQuery);
        const documentSnapshots = await getDocs(first);
        console.log("Document snapsho", documentSnapshots, documentSnapshots.docs.length);
        if (documentSnapshots.docs.length > 1) {
            setFirstDoc(documentSnapshots.docs[0]);
            setLastDoc(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
        }
        console.log("all docs count", allDocs.data().count);
        setCollectionCount(allDocs.data().count);
        console.log("Docs in feedback", documentSnapshots.docs);
        console.log("Collection count", allDocs.data().count);
        let tempFeedback = [];
        documentSnapshots.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            let tempDoc = doc.data();
            let tempRow = {
                anomalyID: tempDoc.rowKey,
                server: tempDoc.Server_ID,
                metric: tempDoc.anomalyType,
                timestamp: moment.unix(tempDoc.Timestamp.seconds).format('LLLL'),
                value: tempDoc.value,
                feedback: tempDoc.feedback !== undefined ? Object.keys(tempDoc.feedback).map((user) => { return { user: user, feedback: tempDoc.feedback[user] } }) : [],
                feedbackCount: tempDoc.feedback !== undefined ? Object.keys(tempDoc.feedback).length : 0,
            };
            tempFeedback.push(tempRow);
        });
        console.log("Feedback parsed", tempFeedback);
        setFeedback(tempFeedback);
        setLoading(false);
    }, [lastDoc, conditions, topics, index, order]);

    const getPrevFeedback = useCallback(async () => {
        setLoading(true);
        console.log("Getting previous feedback: first doc ref", firstDoc);
        setCurrentStart((prev) => prev - docsPerQuery);
        let first;
        let countQuery;
        first = query(collection(firestore, "aiops"), ...conditions, where("topic", "in", topics), orderBy(index, order), endBefore(firstDoc), limitToLast(docsPerQuery));
        countQuery = query(collection(firestore, "aiops"), ...conditions, where("topic", "in", topics));
        const allDocs = await getCountFromServer(countQuery);
        const documentSnapshots = await getDocs(first);
        setFirstDoc(documentSnapshots.docs[0]);
        setLastDoc(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
        setCollectionCount(allDocs.data().count);
        console.log("Docs in feedback", documentSnapshots.docs);
        console.log("Collection count", allDocs.data().count);
        let tempFeedback = [];
        documentSnapshots.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            let tempDoc = doc.data();
            let tempRow = {
                anomalyID: tempDoc.rowKey,
                server: tempDoc.Server_ID,
                metric: tempDoc.anomalyType,
                timestamp: moment.unix(tempDoc.Timestamp.seconds).format('LLLL'),
                value: tempDoc.value,
                feedback: tempDoc.feedback !== undefined ? Object.keys(tempDoc.feedback).map((user) => { return { user: user, feedback: tempDoc.feedback[user] } }) : [],
                feedbackCount: tempDoc.feedback !== undefined ? Object.keys(tempDoc.feedback).length : 0,
            };
            tempFeedback.push(tempRow);
        });
        console.log("Feedback parsed", tempFeedback);
        setFeedback(tempFeedback);
        setLoading(false);
    }, [firstDoc, conditions, topics, index, order]);

    const handleChangeFilter = (filters) => {
        console.log("Changing column filters");
        setCurrentStart(0);
        setFirstDoc('');
        setLastDoc('');
        let tempOrder = "Timestamp";
        let tempConditions = filters.map((filter, index) => {
            if (filter.Operation !== "==") {
                console.log("Filter where operation not equal to ==", filter)
                tempOrder = filter.Field;
            }
            console.log("Condition number ", index, filter.Field, filter.Operation, filter.Value);
            if (filter.Field === "value") {
                return where(filter.Field, filter.Operation, parseInt(filter.Value));
            }
            return where(filter.Field, filter.Operation, filter.Value);
        })
        console.log("New conditions from advanced filter change", tempConditions);
        console.log(tempOrder);
        setIndex(tempOrder);
        setConditions(tempConditions);
    }

    const downloadAll = async () => {
        let tempFeedback = [];
        let downloadQuery;
        downloadQuery = query(collection(firestore, "aiops"), ...conditions, orderBy(index, order));
        const documentSnapshots = await getDocs(downloadQuery);
        documentSnapshots.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            let tempDoc = doc.data();
            if (tempDoc.feedback !== undefined) {
                Object.keys(tempDoc.feedback).forEach((user) => {
                    let tempRow = {
                        anomalyID: tempDoc.rowKey,
                        server: tempDoc.Server_ID,
                        metric: tempDoc.anomalyType,
                        timestamp: moment.unix(tempDoc.Timestamp.seconds).format('LLLL'),
                        value: tempDoc.value,
                        feedback: feedbackColor[tempDoc.feedback[user]][1],
                        user: user,
                    };
                    tempFeedback.push(tempRow);
                })
            } else {
                let tempRow = {
                    anomalyID: tempDoc.rowKey,
                    server: tempDoc.Server_ID,
                    metric: tempDoc.anomalyType,
                    timestamp: moment.unix(tempDoc.Timestamp.seconds).format('LLLL'),
                    value: tempDoc.value,
                    user: null,
                    feedback: null,
                };
                tempFeedback.push(tempRow);
            }
        });
        console.log("Feedback to download", tempFeedback);
        return tempFeedback;
    };

    const onRequestSort = (event, property) => {
        if (order === "asc") {
            setOrder("desc");
        } else {
            setOrder("asc");
        }
        setCurrentStart(0);
        setFirstDoc('');
        setLastDoc('');
        console.log("Requested change in sort");
    }

    const clearFilters = () => {
        setCurrentStart(0);
        setFirstDoc('');
        setLastDoc('');
        setIndex("Timestamp");
        setOrder("desc");
        setConditions([]);
    }

    useEffect(() => {
        if (firstDoc === '' && lastDoc === '' && currentStart === 0 && topics !== null) {
            console.log("Change of conditions and querying feedback", topics);
            getNextFeedback();
        }
    }, [conditions, firstDoc, lastDoc, currentStart, topics, index, order]);

    return (
        <>
            <Fade in={true} {...({ timeout: 1000 })}>
                <Grid2 container sx={{ alignItems: "center", width: "100%", height: "100%" }} direction="column">
                    <Box sx={{ display: "flex", alignItems: "center", marginY: 2 }}>
                        <FeedbackIcon sx={{ fontSize: "2rem", marginRight: 1, color: "#6aa0f7" }} />
                        <Typography variant="h5" component="h5">
                            Feedback Table
                        </Typography>
                    </Box>
                    {(feedback !== null && collectionCount !== null) ? (
                        <Fade in={true} {...{ timeout: 1000 }}>
                            <Grid2 sx={{ paddingBottom: 2, paddingX: 2, width: "100%", height: "100%" }}>
                                <FeedbackTable
                                    handleDownload={downloadAll}
                                    data={feedback}
                                    count={collectionCount}
                                    start={currentStart}
                                    docsPerQuery={docsPerQuery}
                                    onNextPage={getNextFeedback}
                                    onPrevPage={getPrevFeedback}
                                    loading={loading}
                                    onAdvancedFilter={handleChangeFilter}
                                    onRequestSort={onRequestSort}
                                    orderBy={index}
                                    order={order}
                                    clearFilters={clearFilters} />
                            </Grid2>
                        </Fade >
                    ) : (
                        <Grid2
                            container
                            sx={{ width: '100%', justifyContent: 'center' }}
                        >
                            <CircularProgress />
                        </Grid2>
                    )}
                </Grid2>
            </Fade>
        </>
    );
}
