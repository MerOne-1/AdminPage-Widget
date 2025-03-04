import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText 
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

// Flag icons for languages
const languageFlags: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸'
};

// Language names
const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español'
};

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    handleClose();
  };

  return (
    <>
      <Button
        color="inherit"
        onClick={handleClick}
        startIcon={<LanguageIcon />}
      >
        {languageFlags[i18n.language] || languageFlags['en']}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {Object.keys(languageNames).map((lng) => (
          <MenuItem 
            key={lng} 
            onClick={() => changeLanguage(lng)}
            selected={i18n.language === lng}
          >
            <ListItemIcon>
              {languageFlags[lng]}
            </ListItemIcon>
            <ListItemText>{languageNames[lng]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
