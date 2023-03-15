import React, { useRef, useCallback, useState, useEffect } from "react";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import MainPageGraph from "../../../common/GraphCommon";
import Slide from "@mui/material/Slide";
import CommonSelectorChip from "../../../common/CommonSelectorChip";
import Divider from "@mui/material/Divider";
import { LinkedList } from "../../../common/LinkedList";
import CircularProgress from "@mui/material/CircularProgress";
import useLazyLoad from "../../../hooks/useLazyLoad";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import AnomaliesCard from "./AnomaliesCard";
import Grow from "@mui/material/Grow";

function GraphsSection(props) {
  // SECTION 1
  const [linkedList, setLinkedList] = useState(null);
  const [head, setHead] = useState(null);
  const [currentNames, setCurrentNames] = useState([]);
  const [anomaliesCounter, setAnomaliesCounter] = useState(null);
  const [loadingCounter, setLoadingCounter] = useState(false);
  const { isLoading, isError, error, results } = useLazyLoad(
    head,
    props.serverName,
    props.timeStamp,
    props.timeUpperLimit
  );

  const intObserver = useRef();
  const lastPostRef = useCallback(
    (post) => {
      if (isLoading) return;

      if (intObserver.current) intObserver.current.disconnect();

      intObserver.current = new IntersectionObserver((posts) => {
        // DETECTED INTERSECTION
        // console.log("Detected intersection, posts:", posts);
        posts.every((entry) => {
          if (entry.isIntersecting && head.next !== null) {
            // INSIDE HEAD UPDATE
            // console.log("Inside head update");
            setHead((prev) => {
              let temp = prev.next;
              return temp;
            });
            return false;
          }
          return true;
        });
      });

      if (post) intObserver.current.observe(post);
    },
    [isLoading, head]
  );

  const onChangeSelectorChip = (value) => {
    console.log("new chips?", value);
    // Added new values
    if (value.length > currentNames.length) {
      setCurrentNames((prev) => {
        // Old and new arrays are merged if adding new metrics to current list
        let mergedArray = [...new Set([...prev, ...value])];
        let ll = new LinkedList();
        for (let i = 0; i < mergedArray.length; i++) {
          if (head === mergedArray[i]) {
            ll = new LinkedList();
            for (let j = i; j < mergedArray.length; j++) {
              ll.add(mergedArray[j]);
            }
            break;
          }
          ll.add(mergedArray[i]);
        }
        setHead(ll.head);
        setLinkedList(ll);
        console.log("Printing linked list");
        ll.printList();
        return mergedArray;
      });
    }
    // deleted values
    else if (value.length < currentNames.length) {
      // Unselected all options
      if (value.length === 0) {
        console.log("Clearing all");
        setHead(null);
        setLinkedList(null);
      }
      // When using select only anomalies 
      else if (currentNames.length - value.length > 1) {
        console.log("Selecting metrics only");
        let ll = new LinkedList();
        for (let i = 0; i < value.length; i++) {
          ll.add(value[i]);
        }
        setHead(ll.head);
        setLinkedList(ll);
        console.log("Printing linked list");
        ll.printList();
      } else {
        for (let i = 0; i < value.length; i++) {
          if (value[i] !== currentNames[i]) {
            // delete results[currentNames[i]];
            let tempLinked = linkedList;
            tempLinked.removeElement(currentNames[i]);
            setHead((prev) => tempLinked.goTo(prev.element));
            setLinkedList(linkedList);
            break;
          }
        }
      }
      setCurrentNames(typeof value === "string" ? value.split(",") : value);
    }
  };

  const handleDelete = (chipToDelete, value) => {
    let tempLinked = linkedList;
    tempLinked.removeElement(value);
    setHead((prev) => tempLinked.goTo(prev.element));
    setLinkedList(linkedList);
    setCurrentNames((chips) =>
      chips.filter((chip) => {
        return chip !== value;
      })
    );
    // delete results[value];
  };

  useEffect(() => {
    console.log("Metrics Names Updated or timeStamp change");
    let ll = new LinkedList();
    for (let i = 0; i < props.metricNames.length; i++) {
      ll.add(props.metricNames[i]);
    }
    setLinkedList(ll);
    setHead(ll.head);
    setCurrentNames(props.metricNames);
  }, [props.metricNames, props.timeStamp]);

  const graphContent = currentNames.map((graphName, i) => {
    // console.log("results in array", results, graphName);
    // console.log("data in index results[graphName]", results[graphName]);
    if (results[graphName] !== undefined) {
      // If the next one is not yet queried
      if (results[currentNames[i + 1]] === undefined) {
        return (
          <Slide
            key={i}
            direction="left"
            in={true}
            mountOnEnter
            unmountOnExit
            {...{ timeout: 1000 }}
          >
            <Box
              key={i}
              sx={{ width: "100%", marginBottom: 2, height: "100%" }}
              ref={lastPostRef}
            >
              <Paper
                key={i}
                elevation={3}
                sx={{ width: "100%", height: "100%", padding: 2 }}
              >
                <MainPageGraph
                  tableData={results[graphName].tableData}
                  metricName={graphName}
                  serverName={props.serverName}
                  mode={"nearest"}
                  unit={
                    props.timeStamp.toString() === "168"
                      ? "day"
                      : props.timeStamp.toString() === "1"
                      ? "minute"
                      : "hour"
                  }
                  key={i}
                  data={results[graphName].data}
                  graphAnimation={false}
                  detailsMode={true}
                />
              </Paper>
            </Box>
          </Slide>
        );
      }
      return (
        <Slide
          key={i}
          direction="left"
          in={true}
          mountOnEnter
          unmountOnExit
          {...{ timeout: 1000 }}
        >
          <Box key={i} sx={{ width: "100%", marginBottom: 2, height: "100%" }}>
            <Paper
              key={i}
              elevation={3}
              sx={{ width: "100%", height: "100%", padding: 2 }}
            >
              <MainPageGraph
                tableData={results[graphName].tableData}
                metricName={graphName}
                serverName={props.serverName}
                mode={"nearest"}
                unit={
                  props.timeStamp.toString() === "168"
                    ? "day"
                    : props.timeStamp.toString() === "1"
                    ? "minute"
                    : "hour"
                }
                key={i}
                data={results[graphName].data}
                graphAnimation={false}
                detailsMode={true}
              />
            </Paper>
          </Box>
        </Slide>
      );
    }
  });

  useEffect(() => {
    setLoadingCounter(true);
    const queryAnomalyCount = async (serverName, timeBefore, upperLimit) => {
      await fetch(
        "https://anomalyhandling.azurewebsites.net/api/responsesfromfeedback",
        {
          method: "POST",
          body: JSON.stringify({
            Server_Name: serverName,
            Time_before: parseInt(timeBefore),
            Upper: upperLimit,
          }),
          headers: {
            "Content-type": "application/json",
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            return response.text().then((text) => {
              // console.log("Get failed");
              // console.log(text);
              throw new Error(text);
            });
          } else {
            return response.json();
          }
        })
        .then((data) => {
          // console.log("Metric Names");
          // console.log(data);
          console.log("Anomaly counter data", data);
          let anomalyCounter = {
            Total: data.current_period.total,
            Negative: data.current_period.total_negative,
            Positive: data.current_period.total_positive,
            Snoozed: data.current_period.total_snooze,
            "No Feedback":
              data.current_period.total_no_response,
          };
          let lastWeekCounter = {
            Total: data.last_week_period.total,
            Negative: data.last_week_period.total_negative,
            Positive: data.last_week_period.total_positive,
            Snoozed: data.last_week_period.total_snooze,
            "No Feedback":
              data.last_week_period.total_no_response,
          };
          setAnomaliesCounter({ data: anomalyCounter, time: timeBefore, lastWeek: lastWeekCounter });
          setLoadingCounter(false);
        })
        .catch((err) => {
          setLoadingCounter(false);
          console.log(err);
          //setError(err);
        });
    };
    queryAnomalyCount(props.serverName, props.timeStamp, props.timeUpperLimit);
  }, [props.serverName, props.timeStamp]);

  return (
    <Grid2
      container
      sx={{
        width: "100%",
        justifyConent: "center",
        alignItems: "center",
        marginTop: 4,
      }}
      direction="column"
    >
      <Divider width="80%" sx={{ marginBottom: 4 }} />
      {anomaliesCounter ? (
        <Grow
          in={anomaliesCounter !== null}
          style={{ transformOrigin: "0 0 0" }}
          {...{ timeout: 1000 }}
        >
          <Grid2
            container
            sx={{
              justifyContent: "center",
              width: "100%",
              alignItems: "center",
            }}
          >
            <AnomaliesCard
              anomaliesCounter={anomaliesCounter}
              loading={loadingCounter}
              serverName={props.serverName}
            />
          </Grid2>
        </Grow>
      ) : (
        <Grid2
          container
          sx={{ justifyContent: "center", width: "100%", alignItems: "center", marginBottom: 2 }}
          direction="column"
        >
          <CircularProgress />
        </Grid2>
      )}
      <CommonSelectorChip
        metricsAnomalies={props.metricsAnomalies}
        names={props.metricNames}
        handleChange={onChangeSelectorChip}
        currentNames={currentNames}
        handleDelete={handleDelete}
      />
      <Grid2 container sx={{ justifyContent: "center", width: "80%" }}>
        {graphContent}
        {isLoading && <CircularProgress />}
      </Grid2>
    </Grid2>
  );
}

export default GraphsSection;
