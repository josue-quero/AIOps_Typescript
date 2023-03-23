import * as React from 'react';
import { useNavigate, Outlet, Link as RouterLink, LinkProps as RouterLinkProps, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useLogout } from '../hooks/useLogout';
import { Slide } from '@mui/material';
import {
  TableView as TableViewIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import IconButton from '@mui/material/IconButton';
import PreviewIcon from '@mui/icons-material/Preview';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import FeedbackIcon from '@mui/icons-material/Feedback';

const drawerWidth = 80;

const navItems = [
  {
    name: 'Overview',
    icon: <PreviewIcon sx={{ fontSize: '2rem' }} />,
    link: '/overview',
  },
  {
    name: 'Alerts',
    icon: <TableViewIcon sx={{ fontSize: '2rem' }} />,
    link: '/alerts',
  },
  {
    name: 'Timeline',
    icon: <TimelineIcon sx={{ fontSize: '2rem' }} />,
    link: '/timeline',
  },
  {
    name: 'Feed',
    icon: <NotificationsIcon sx={{ fontSize: '2rem' }} />,
    link: '/notifications',
  },
  {
    name: 'Feedback',
    icon: <FeedbackIcon sx={{ fontSize: '2rem' }} />,
    link: '/feedback'
  }
];

const selectedStyle = {
  borderLeft: '4px solid #6aa0f7',
  [`& svg`]: {
    color: '#6aa0f7',
  },
  [`& span`]: {
    color: '#6aa0f7',
  },
  marginLeft: '2px',
};

const settings = ['Account', 'Logout'];

type LayoutProps = {
  changes: number;
}

type navItem = {
  name: string;
  icon: JSX.Element;
  link: string;
}

const Link = React.forwardRef<HTMLAnchorElement, RouterLinkProps>(function Link(
  itemProps,
  ref,
) {
  return <RouterLink ref={ref} {...itemProps} role={undefined} />;
});

const Layout = ({changes}: LayoutProps) => {
  // const theme = useTheme();
  // const [open, setOpen] = React.useState(false);

  const pathName = useLocation().pathname;
  console.log("Path name", pathName);
  const [inPage, setInPage] = React.useState(true);
  const [link, setLink] = React.useState('');
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { logout, error, loading } = useLogout();

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handlePageChange = (item: navItem) => {
    if (item.link === link) {
      return;
    }
    setLink(item.link);
    setInPage(false);
  };

  const handleOnExit = () => {
    navigate(link);
    setInPage(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (

    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* <NavBar open={open} handleDrawerOpen={handleDrawerOpen} drawerWidth={drawerWidth}/> */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant='permanent'
        anchor='left'
      >
        {/* <Toolbar /> */}
        <Box sx={{ height: '100%' }}>
          <List sx={{ marginTop: 1 }}>
            {navItems.map((item, index) => (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.link}
                  sx={{
                    justifyContent: 'center',
                    ...(pathName === item.link && selectedStyle),
                  }}
                  onClick={() => handlePageChange(item)}
                >
                  {item.name === 'Feed' ? (
                      <ListItemIcon
                        sx={{
                          justifyContent: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                        }}
                      >
                        <Badge badgeContent={pathName !== "/notifications" ? changes : 0} color='primary'>
                          {item.icon}
                        </Badge>
                        <span>{item.name}</span>
                      </ListItemIcon>
                  ) : (
                    <ListItemIcon
                      sx={{
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        fontSize: 12,
                      }}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </ListItemIcon>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              position: 'absolute',
              bottom: 0,
              paddingBottom: 2,
            }}
          >
            <Tooltip title='Open settings'>
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt='Remy Sharp' src='/static/images/avatar/2.jpg' />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id='menu-appbar'
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleLogout}>
                  <Typography textAlign='center'>{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
      </Drawer>
      <Box component='main' sx={{ flexGrow: 1 }}>
        {/* <Toolbar /> */}
        <Slide
          direction='left'
          in={inPage}
          onExited={handleOnExit}
          mountOnEnter
          unmountOnExit
          timeout={300}
        >
          <div style={{ width: '100%' }}>
            <Outlet />
          </div>
        </Slide>
      </Box>
    </Box>
  );
}

export default Layout;
