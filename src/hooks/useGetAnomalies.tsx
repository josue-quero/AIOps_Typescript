import { useState, useEffect, useRef } from 'react';
import {
    collection,
    query,
    onSnapshot,
    limit,
    where,
    updateDoc,
    doc,
    orderBy
} from "firebase/firestore";
import { firestore } from 'firebase/order-food';
import {
    getDocs,
} from "firebase/firestore";
import moment from 'moment-timezone';
import { onAuthStateChanged, User } from 'firebase/auth';

interface TempUser {
    email: string;
    id: string;
    lastAnomaly: {seconds: number, nanoseconds: number} | undefined;
    topic: string[] | undefined;
}

export interface Anomaly {
    Anomaly: boolean;
    Date: {seconds: number, nanoseconds: number};
    Status: number;
    Value: number;
}

export interface OneHourData {
    docId: string;
    Client_Name: string;
    OS: string;
    Server_ID: string;
    Timestamp: {seconds: number, nanoseconds: number};
    anomalyType: string;
    eventType: string;
    one_hour_data: Anomaly[];
    partitionKey: string;
    rowKey: string;
    status: null | number;
    topic: string;
    value: number;
    feedback: {}
}

const useGetAnomalies = (
    ref: React.MutableRefObject<boolean>,
    initialValue: null,
    lastAnomaly: moment.Moment | null,
    user: User | null,
    handleSetLastAnomaly: (value: moment.Moment) => void,
    handleNewAnomaly: () => void):
    ([OneHourData[] | null, number, React.Dispatch<React.SetStateAction<number>>, string[] | null, (date: moment.Moment, userUpdate?: TempUser) => void]) => {
    const mounting = useRef(true);
    const [anomalies, setAnomalies] = useState<null | OneHourData[]>(initialValue);
    const [topics, setTopics] = useState<null | string[]>(null);
    const [initialCount, setInitialCount] = useState(0);
    const [userDoc, setUserDoc] = useState<TempUser | null>(null);

    const updateLastAnomaly = async (date: moment.Moment, userUpdate?: TempUser) => {
        console.log("Updating last anomaly", date.format('LLLL'));
        if (userUpdate !== null) {
            if (userUpdate === undefined) {
                userUpdate = userDoc as TempUser;
            }
            const docRef = doc(firestore, 'usersAiops', userUpdate.id);
            await updateDoc(docRef, {
                lastAnomaly: date.toDate()
            });
        }
    }

    useEffect(() => {
        if (user) {
            const getUserInfo = async () => {
                console.log("User", user);
                const docRef = query(collection(firestore, 'usersAiops'), where("email", '==', user.email));
                const docSnap = await getDocs(docRef);
                docSnap.forEach((doc) => {
                    const tempUser = doc.data() as TempUser;
                    setUserDoc(tempUser);
                    setTopics(tempUser.topic !== undefined ? tempUser.topic : ['Todo_Windows']);
                    console.log("temp user and last anomaly", tempUser, tempUser.lastAnomaly);
                    if (tempUser.lastAnomaly !== undefined) {
                        handleSetLastAnomaly(moment.unix(tempUser.lastAnomaly.seconds));
                    } else {
                        const tempNow = moment();
                        updateLastAnomaly(tempNow, tempUser);
                        handleSetLastAnomaly(tempNow);
                    }
                })
                // if (docSnap.exists()) {
                //   const docResult = docSnap.data();
                //   setTopics(docResult.topic !== undefined ? docResult.topic : ['Todo_Windows']);
                //   handleSetLastAnomaly(docResult.lastAnomaly !== undefined ? docResult.lastAnomaly : '');
                // } else {
                //   // doc.data() will be undefined in this case
                //   console.log("No user exists for some reason!");
                // }
            }
            getUserInfo();
        }
    }, [user]);

    useEffect(() => {
        if (lastAnomaly !== null && topics !== null) {
            console.log("Wanting to remount snapshot and refcurrent", ref.current);
            if (ref.current) {
                console.log("Making query for snapshot");
                const q = query(collection(firestore, 'aiops'), where("topic", "in", topics), orderBy("Timestamp", "desc"), limit(100));
                onSnapshot(q, (querySnapshot) => {
                    let tempAnomalies = new Array(0);
                    console.log("Run snapshot", querySnapshot);
                    if (querySnapshot.empty) {
                        setAnomalies([])
                        return
                    }
                    if (mounting.current && !querySnapshot.metadata.fromCache) {
                        mounting.current = false;
                    } else if (!querySnapshot.metadata.fromCache) {
                        querySnapshot.docChanges().forEach((change) => {
                            if (change.type === "added") {
                                console.log("New city: ", change.doc.data());
                                handleNewAnomaly();
                            }
                        });
                    }

                    let tempCount = 0;
                    querySnapshot.forEach((doc) => {
                        const docId = doc.id;
                        const data = doc.data();
                        const newDoc = { docId, ...data } as OneHourData;
                        tempAnomalies.push(newDoc);
                        if (lastAnomaly.isBefore(moment.unix(newDoc.Timestamp.seconds))) {
                            tempCount += 1;
                        }
                    });

                    setInitialCount(tempCount);
                    setAnomalies(tempAnomalies);
                });
                return () => {
                    ref.current = false;
                };
            }
        }
    }, [ref, lastAnomaly, topics]);
    return [anomalies, initialCount, setInitialCount, topics, updateLastAnomaly];
}

export default useGetAnomalies;
