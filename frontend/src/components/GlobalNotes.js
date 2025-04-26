import React, { useState, useEffect } from "react";
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  TextField,
  Button,
  makeStyles,
  Divider,
  Paper,
  Fab,
} from "@material-ui/core";
import NoteIcon from "@material-ui/icons/Note";
import CloseIcon from "@material-ui/icons/Close";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: 350,
    flexShrink: 0,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  drawerPaper: {
    width: 350,
    backgroundColor: theme.palette.background.default,
    borderLeft: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(1, 2),
    justifyContent: "space-between",
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  notesList: {
    flexGrow: 1,
    overflow: "auto",
  },
  noteItem: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  noteContent: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "200px",
  },
  noteForm: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  noteInput: {
    marginBottom: theme.spacing(2),
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: theme.zIndex.drawer + 1,
  },
  collapsed: {
    width: 0,
    overflow: "hidden",
  },
}));

// Accept notes and handlers as props
const GlobalNotes = ({ notes, onAddNote, onDeleteNote }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  // Local state for the input fields
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [expandedNote, setExpandedNote] = useState(null);

  const handleAddNote = () => {
    if (newNoteTitle && newNoteContent) {
      // Call the handler passed from App.js
      onAddNote({ title: newNoteTitle, content: newNoteContent });
      // Clear local input fields
      setNewNoteTitle("");
      setNewNoteContent("");
    }
  };

  const handleDeleteNote = (id) => {
    // Call the handler passed from App.js
    onDeleteNote(id);
    // If the deleted note was expanded, collapse it
    if (expandedNote?.id === id) {
      setExpandedNote(null);
    }
  };

  const toggleDrawer = () => {
    setOpen(!open);
    if (!open) {
      setExpandedNote(null);
    }
  };

  return (
    <>
      <Fab
        className={classes.fab}
        color="primary"
        onClick={toggleDrawer}
        aria-label="notes"
      >
        <NoteIcon />
      </Fab>

      <Drawer
        className={`${classes.drawer} ${!open ? classes.collapsed : ""}`}
        variant="persistent"
        anchor="right"
        open={open}
        classes={{
          paper: `${classes.drawerPaper} ${!open ? classes.collapsed : ""}`,
        }}
      >
        <div className={classes.drawerHeader}>
          <Typography variant="h6">Research Notes</Typography>
          <IconButton onClick={toggleDrawer}>
            <CloseIcon />
          </IconButton>
        </div>

        {expandedNote ? (
          <Paper style={{ padding: 16, margin: 16 }}>
            <Typography variant="h6" gutterBottom>
              {expandedNote.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {new Date(expandedNote.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body1" style={{ whiteSpace: "pre-wrap" }}>
              {expandedNote.content}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setExpandedNote(null)}
              style={{ marginTop: 16 }}
            >
              Back to List
            </Button>
          </Paper>
        ) : (
          <>
            <List className={classes.notesList}>
              {notes.map((note) => (
                <ListItem
                  key={note.id}
                  button
                  className={classes.noteItem}
                  onClick={() => setExpandedNote(note)}
                >
                  <ListItemText
                    primary={note.title}
                    secondary={note.content}
                    secondaryTypographyProps={{
                      className: classes.noteContent,
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <div className={classes.noteForm}>
              <TextField
                fullWidth
                label="Note Title"
                variant="outlined"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className={classes.noteInput}
              />
              <TextField
                fullWidth
                label="Note Content"
                variant="outlined"
                multiline
                rows={3}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className={classes.noteInput}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddNote}
                fullWidth
              >
                Add Note
              </Button>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
};

export default GlobalNotes;
