import * as React from 'react';
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListSubheader from '@mui/material/ListSubheader';
import Fade from '@mui/material/Fade';

type AnomalyDetailsProps = {
    loading: boolean;
    anomalyDetails: {};
}

const AnomalyDetails = (props: AnomalyDetailsProps) => {
    console.log("AnomalyDetails from table", props.anomalyDetails)

    return (
        <div>
            <Fade in={!props.loading} {...({ timeout: 500 })}>
                <List disablePadding sx={{width: "100%"}} subheader={
                    <ListSubheader component="div" id="nested-list-subheader" sx={{textAlign: "center"}}>
                        Anomaly Details
                    </ListSubheader>
                    }>  
                    {(typeof props.anomalyDetails === 'string' || props.anomalyDetails instanceof String) ? (
                        <Typography sx={{marginTop: 4}}>
                            Anomaly Details not found
                        </Typography>
                    ) : 
                    (<>
                        {Object.keys(props.anomalyDetails).map((key, i) => { 
                        return (
                            <ListItem key={i} disablePadding sx={{width: "100%"}}>
                                <Grid2 key={i} container direction="row" sx={{ boxShadow: "2px 2px 3px rgba(0,0,0, 0.25)", borderRadius: 1, backgroundColor: "#6aa0f7", width: "100%", minHeight: 40, marginTop: (i === 0 ? 0 : 2)}}>
                                    <Grid2 sx={{ width: "50%", display: "flex", justifyContent: "center", alignItems: "center", wordBreak: "break-word"}}>
                                        <Typography style={{textAlign: "center", fontSize: 12}} fontWeight= {700}>
                                            {key.replaceAll('_',' ')}
                                        </Typography>
                                    </Grid2>
                                    <Grid2 sx={{width: "50%", display: "flex", justifyContent: "center", alignItems: "center", wordBreak: "break-word"}}>
                                        <Typography style={{ textAlign: "center", fontSize: 12}}>
                                            {props.anomalyDetails[key as keyof typeof props.anomalyDetails]}
                                        </Typography>
                                    </Grid2>
                                </Grid2>
                            </ListItem>
                        )
                    })}
                    </>)
                    }         
                </List>
            </Fade>
        </div>
    );
}

export default AnomalyDetails;