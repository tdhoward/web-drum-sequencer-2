import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { canInstallSelector } from '../common/window/window.selectors';
import { selectedThemeIdSelector, setSelectedThemeId } from '../common';
import { colorThemes } from '../styles/theme';
import { promptToInstall } from '../services/pwaInstall';
import { Modal } from './Modal.component';

const themeOptions = Object.values(colorThemes).map(theme => ({
  id: theme.id,
  name: theme.name,
}));

const isStandalone = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(display-mode: standalone)').matches
);

const MenuRoot = styled.div`
  display: inline-flex;
  position: relative;
  z-index: 30;
`;

const MenuButton = styled.button`
  align-items: center;
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  display: inline-flex;
  height: 2.4rem;
  justify-content: center;
  padding: 0;
  touch-action: manipulation;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  width: 2.4rem;

  &:hover {
    background: ${({ theme }) => theme.colors.surfacePanelRaised};
    border-color: ${({ theme }) => theme.colors.borderHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 2px;
  }
`;

const DotsIcon = styled.span`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;

  span {
    background: currentColor;
    border-radius: 50%;
    display: block;
    height: 0.28rem;
    width: 0.28rem;
  }
`;

const MenuPanel = styled.div`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.4rem;
  box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  min-width: 17rem;
  padding: 0.5rem;
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
`;

const MenuSectionLabel = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1;
  padding: 0.55rem 0.6rem 0.35rem;
  text-transform: uppercase;
`;

const MenuDivider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  margin: 0.45rem 0;
`;

const MenuItem = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0.3rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  display: flex;
  font-size: 0.82rem;
  font-weight: 600;
  justify-content: space-between;
  line-height: 1.2;
  min-height: 2.25rem;
  opacity: ${({ disabled }) => (disabled ? 0.52 : 1)};
  padding: 0.55rem 0.6rem;
  text-align: left;
  touch-action: manipulation;
  transition: background-color 0.16s ease, color 0.16s ease;
  width: 100%;

  &:hover {
    background: ${({ disabled, theme }) => (disabled ? 'transparent' : theme.colors.borderSubtle)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 1px;
  }
`;

const MenuHint = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;
  font-weight: 600;
  margin-left: 1rem;
`;

const ThemeOption = styled(MenuItem)`
  justify-content: flex-start;
`;

const ThemeRadio = styled.span`
  border: 2px solid ${({ $selected, theme }) => (
    $selected ? theme.colors.accentPrimary : theme.colors.borderDefault
  )};
  border-radius: 50%;
  display: inline-flex;
  height: 0.8rem;
  margin-right: 0.6rem;
  position: relative;
  width: 0.8rem;

  &::after {
    background: ${({ theme }) => theme.colors.accentPrimary};
    border-radius: 50%;
    content: '';
    display: ${({ $selected }) => ($selected ? 'block' : 'none')};
    height: 0.38rem;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 0.38rem;
  }
`;

const AboutDialog = styled.div`
  background: ${({ theme }) => theme.colors.surfacePanel};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.45rem;
  box-shadow: 0 1.25rem 3rem rgba(0, 0, 0, 0.45);
  color: ${({ theme }) => theme.colors.textPrimary};
  max-width: calc(100vw - 2rem);
  padding: 1.25rem;
  width: 24rem;
`;

const AboutModalFrame = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  padding: 1rem;
  width: 100%;
`;

const AboutHeader = styled.div`
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
`;

const AboutTitle = styled.h2`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 1.1rem;
  line-height: 1.2;
  margin: 0;
`;

const AboutText = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.85rem;
  line-height: 1.45;
  margin: 0.9rem 0 0;
`;

const CloseButton = styled.button`
  align-items: center;
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.3rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  display: inline-flex;
  font-size: 1rem;
  font-weight: 600;
  height: 1.8rem;
  justify-content: center;
  line-height: 1;
  margin-left: 1rem;
  padding: 0;
  width: 1.8rem;

  &:hover {
    background: ${({ theme }) => theme.colors.borderSubtle};
    border-color: ${({ theme }) => theme.colors.borderHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 2px;
  }
`;

const AppMenuComponent = ({
  canInstall,
  selectedThemeId,
  setSelectedThemeId: selectTheme,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const menuRef = useRef(null);
  const standalone = isStandalone();
  const installAvailable = canInstall && !standalone;
  const installStatus = standalone ? 'Installed' : 'Unavailable';

  useEffect(() => {
    if (!isMenuOpen && !isAboutOpen) {
      return undefined;
    }

    const handleDocumentMouseDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsAboutOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [isMenuOpen, isAboutOpen]);

  const handleInstall = () => {
    if (!installAvailable) {
      return;
    }

    promptToInstall();
    setIsMenuOpen(false);
  };

  return (
    <MenuRoot ref={menuRef}>
      <MenuButton
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label="Open app menu"
        onClick={() => setIsMenuOpen(open => !open)}
        title="App menu"
        type="button"
      >
        <DotsIcon aria-hidden="true">
          <span />
          <span />
          <span />
        </DotsIcon>
      </MenuButton>

      {isMenuOpen && (
        <MenuPanel aria-label="App menu" role="menu">
          <MenuItem
            disabled={!installAvailable}
            onClick={handleInstall}
            role="menuitem"
            type="button"
          >
            <span>Install app</span>
            {!installAvailable && <MenuHint>{installStatus}</MenuHint>}
          </MenuItem>

          <MenuDivider role="presentation" />

          <MenuSectionLabel role="presentation">Theme</MenuSectionLabel>
          {themeOptions.map(option => {
            const isSelected = option.id === selectedThemeId;

            return (
              <ThemeOption
                key={option.id}
                aria-checked={isSelected}
                onClick={() => selectTheme(option.id)}
                role="menuitemradio"
                type="button"
              >
                <ThemeRadio $selected={isSelected} aria-hidden="true" />
                <span>{option.name}</span>
              </ThemeOption>
            );
          })}

          <MenuDivider role="presentation" />

          <MenuItem
            onClick={() => {
              setIsMenuOpen(false);
              setIsAboutOpen(true);
            }}
            role="menuitem"
            type="button"
          >
            <span>About</span>
          </MenuItem>
        </MenuPanel>
      )}

      <Modal show={isAboutOpen}>
        <AboutModalFrame
          onClick={() => setIsAboutOpen(false)}
        >
          <AboutDialog
            aria-modal="true"
            aria-labelledby="about-title"
            onClick={event => event.stopPropagation()}
            role="dialog"
          >
            <AboutHeader>
              <AboutTitle id="about-title">Web Drum Sequencer</AboutTitle>
              <CloseButton
                aria-label="Close about"
                onClick={() => setIsAboutOpen(false)}
                type="button"
              >
                x
              </CloseButton>
            </AboutHeader>
            <AboutText>
              A browser-based drum machine and pattern sequencer built with the Web Audio API.
            </AboutText>
          </AboutDialog>
        </AboutModalFrame>
      </Modal>
    </MenuRoot>
  );
};

AppMenuComponent.propTypes = {
  canInstall: PropTypes.bool.isRequired,
  selectedThemeId: PropTypes.string.isRequired,
  setSelectedThemeId: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  canInstall: canInstallSelector(state),
  selectedThemeId: selectedThemeIdSelector(state),
});

const mapDispatchToProps = {
  setSelectedThemeId,
};

export const AppMenu = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppMenuComponent);
