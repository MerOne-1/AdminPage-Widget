import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  EventNote as BookingsIcon,
} from '@mui/icons-material';
import { Link, Outlet } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

// Menu items will be translated in the component

export default function Layout() {
  const [open, setOpen] = useState(true);
  const { t } = useTranslation();
  
  // Define menu items with translations
  const menuItems = [
    { text: t('navigation.dashboard'), icon: <DashboardIcon />, path: '/' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
    { text: t('navigation.services'), icon: <CategoryIcon />, path: '/services' },
    { text: t('navigation.professionals'), icon: <PeopleIcon />, path: '/staff' },
    { text: t('navigation.bookings'), icon: <BookingsIcon />, path: '/bookings' },
    { text: 'Schedule', icon: <CalendarIcon />, path: '/schedule' },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/settings' }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={() => setOpen(!open)}
            edge="start"
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Booking Widget Admin
          </Typography>
          <LanguageSwitcher />
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} to={item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>
      <Main open={open}>
        <Toolbar />
        <Outlet />
      </Main>
    </Box>
  );
}
