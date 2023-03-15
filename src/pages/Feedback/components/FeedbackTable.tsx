import React, { useEffect, useState } from "react";
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Circle as CircleIcon } from '@mui/icons-material';
import TableFilterOptions from "../../../common/TableFilterOptions";
import EnhancedTableToolbar from "../../Alerts/EnhancedTableToolbar";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: "#6aa0f7",
        color: theme.palette.common.white,
        fontFamily: `Oswald, sans-serif`,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        fontFamily: `Oswald, sans-serif`,
    },
}));

const feedbackColor = {
    1: ["#007500", "Positive"],
    "-1": ["#f7584d", "Negative"],
    0: ["#f5ce64", "Snoozed"],
};

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

function TablePaginationActions(props) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;

    console.log("TablePaginationActions", page);

    const handleBackButtonClick = (event) => {
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event) => {
        onPageChange(event, page + 1);
    };

    console.log("TablePaginationActions", page === 0);
    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="previous page">
                {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page">
                {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </IconButton>
        </Box>
    );
}

TablePaginationActions.propTypes = {
    count: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
};

function Row(props) {
    const { row } = props;
    const [open, setOpen] = React.useState(false);

    return (
        <React.Fragment>
            <StyledTableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <StyledTableCell>
                    {row.feedback.length > 0 && (
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}>
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    )}
                </StyledTableCell>
                <StyledTableCell component="th" scope="row">
                    <p className="result-text-modal">{row.anomalyID}</p>
                </StyledTableCell>
                <StyledTableCell align="left" sx={{ margin: 0 }}><p className="result-text-modal">{row.server}</p></StyledTableCell>
                <StyledTableCell align="left"><p className="result-text-modal">{row.metric}</p></StyledTableCell>
                <StyledTableCell align="left"><p className="result-text-modal">{row.timestamp}</p></StyledTableCell>
                <StyledTableCell align="left"><p className="result-text-modal">{row.value}</p></StyledTableCell>
                <StyledTableCell align="center"><p className="result-text-modal">{row.feedbackCount}</p></StyledTableCell>
                {/* <StyledTableCell align="right">{((row.confidence)*100).toFixed(2).toString() + "%"}</StyledTableCell> */}
            </StyledTableRow>
            {row.feedback.length > 0 && (
                <StyledTableRow>
                    <StyledTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                                <Typography variant="h6" gutterBottom component="div">
                                    Feedback
                                </Typography>
                                <Table size="small" aria-label="purchases">
                                    <TableHead>
                                        <StyledTableRow>
                                            <StyledTableCell>User</StyledTableCell>
                                            <StyledTableCell align="center">Feedback</StyledTableCell>
                                        </StyledTableRow>
                                    </TableHead>
                                    <TableBody>
                                        {row.feedback.map((feedbackRow, index) => (
                                            <StyledTableRow key={index}>
                                                <StyledTableCell component="th" scope="row">
                                                    {feedbackRow.user}
                                                </StyledTableCell>
                                                <StyledTableCell align="center">
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <span style={{ width: 80 }}>{feedbackColor[feedbackRow.feedback][1]} </span>
                                                        <CircleIcon
                                                            sx={{
                                                                fontSize: '1.2rem',
                                                                marginLeft: '4px',
                                                                color: feedbackColor[feedbackRow.feedback][0],
                                                            }}
                                                        />
                                                    </div>
                                                </StyledTableCell>
                                            </StyledTableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </StyledTableCell>
                </StyledTableRow>
            )}
        </React.Fragment>
    );
}

Row.propTypes = {
    row: PropTypes.shape({
        anomalyID: PropTypes.string.isRequired,
        server: PropTypes.string.isRequired,
        metric: PropTypes.string.isRequired,
        timestamp: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        feedback: PropTypes.arrayOf(
            PropTypes.shape({
                user: PropTypes.string.isRequired,
                feedback: PropTypes.number.isRequired,
            }),
        ).isRequired,
        feedbackCount: PropTypes.number.isRequired,
    }).isRequired,
};

function FeedbackTable(props) {
    const [filterOptions, setFilterOptions] = useState(false);
    const onRequestSort = props.onRequestSort;
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    let emptyRows = 0;
    if (((page * rowsPerPage) % props.docsPerQuery) + rowsPerPage > props.data.length) {
        emptyRows = (((page * rowsPerPage) % props.docsPerQuery) + rowsPerPage) - props.data.length;
    }

    console.log("Rendering feedback table", props);

    useEffect(() => {
        if (props.start === props.docsPerQuery && page > 0) {
            console.log("Resetting page", props.start, props.docsPerQuery);
            setPage(0);
        }
    }, [props.data])

    const handleChangePage = (event, newPage) => {
        console.log("Page to", newPage);
        let newStart = newPage * rowsPerPage;
        console.log("Start from", newStart);
        console.log("Original start", props.start);
        // The new page is above current data
        if (newStart > (props.start - 1)) {
            console.log("Next page");
            props.onNextPage();
        }
        // The new page is below current data
        else if (newStart < props.start - props.docsPerQuery) {
            console.log("Previous page");
            props.onPrevPage();
        }
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        console.log("Changed rows per page", event.target.value);
        console.log("New page", parseInt(((page * rowsPerPage) / event.target.value), 10));
        setPage(parseInt(((page * rowsPerPage) / event.target.value), 10));
        setRowsPerPage(parseInt(event.target.value, 10));
    };

    const handleHideOptions = () => {
        setFilterOptions((prev) => !prev);
    }

    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <Paper sx={{ width: "100%", mb: 2, overflow: "hidden" }}>
            <EnhancedTableToolbar filterOptions={filterOptions} handleHideOptions={handleHideOptions} handleDownload={props.handleDownload} title={'Feedback'}/>
            <TableFilterOptions clearFilters={props.clearFilters} onAdvancedFilter={props.onAdvancedFilter} openFilter={filterOptions} setOpenFilter={setFilterOptions} />
            <TableContainer sx={{ maxHeight: "78vh" }}>
                <Table stickyHeader sx={{ maxHeight: "78vh", height: "78vh" }} aria-label="customized pagination table">
                    <TableHead>
                        <TableRow>
                            <StyledTableCell />
                            <StyledTableCell>
                                <TableSortLabel
                                    active={props.orderBy === "rowKey"}
                                    direction={props.order}
                                    onClick={createSortHandler("rowKey")}
                                    hideSortIcon={props.orderBy !== "rowKey"}
                                    sx={{pointerEvents: props.orderBy !== "rowKey" && 'none'}}
                                >
                                    Anomaly ID
                                </TableSortLabel>
                            </StyledTableCell>
                            <StyledTableCell align="left">
                                <TableSortLabel
                                    active={props.orderBy === "Server_ID"}
                                    direction={props.order}
                                    onClick={createSortHandler("Server_ID")}
                                    hideSortIcon={props.orderBy !== "Server_ID"}
                                    sx={{pointerEvents: props.orderBy !== "Server_ID" && 'none'}}
                                >
                                    Server
                                </TableSortLabel>
                            </StyledTableCell>
                            <StyledTableCell align="left">
                                <TableSortLabel
                                    active={props.orderBy === "anomalyType"}
                                    direction={props.order}
                                    onClick={createSortHandler("anomalyType")}
                                    hideSortIcon={props.orderBy !== "anomalyType"}
                                    sx={{pointerEvents: props.orderBy !== "anomalyType" && 'none'}}
                                >
                                    Metric
                                </TableSortLabel>
                            </StyledTableCell>
                            <StyledTableCell align="left">
                                <TableSortLabel
                                    active={props.orderBy === "Timestamp"}
                                    direction={props.order}
                                    onClick={createSortHandler("Timestamp")}
                                    hideSortIcon={props.orderBy !== "Timestamp"}
                                    sx={{pointerEvents: props.orderBy !== "Timestamp" && 'none'}}
                                >
                                    Timestamp
                                </TableSortLabel>
                            </StyledTableCell>
                            <StyledTableCell align="left">
                                <TableSortLabel
                                    active={props.orderBy === "value"}
                                    direction={props.order}
                                    onClick={createSortHandler("value")}
                                    hideSortIcon={props.orderBy !== "value"}
                                    sx={{pointerEvents: props.orderBy !== "value" && 'none'}}
                                >
                                    Value
                                </TableSortLabel>
                            </StyledTableCell>
                            <StyledTableCell align="left">Feedback count</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!props.loading ? (
                            <>
                                {(rowsPerPage > 0 ? props.data.slice(((page * rowsPerPage) % props.docsPerQuery), (((page * rowsPerPage) % props.docsPerQuery) + rowsPerPage)) : props.data).map((row, index) => (
                                    <Row key={index} row={row} />
                                ))}
                                {emptyRows > 0 && (
                                    <TableRow style={{ height: 68 * emptyRows }}>
                                        <TableCell colSpan={7} />
                                    </TableRow>
                                )}
                            </>
                        ) : (
                            <TableRow >
                                <TableCell sx={{ textAlign: "center" }} colSpan={7}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 30]}
                component='div'
                colSpan={5}
                count={props.count}
                rowsPerPage={rowsPerPage}
                page={page}
                SelectProps={{
                    inputProps: {
                        'aria-label': 'rows per page',
                    },
                    native: true,
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
            />
        </Paper>
    );
}

export default React.memo(FeedbackTable);