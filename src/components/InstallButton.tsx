import React from 'react';
import { connect } from 'react-redux';
import { HoverButton } from './design-system';
import { promptToInstall } from '../services/pwaInstall';
import { canInstallSelector } from '../common/window/window.selectors';
import type { RootState } from '../reducer';

type InstallButtonComponentProps = {
  canInstall: boolean;
};

const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

const InstallButtonComponent = ({ canInstall }: InstallButtonComponentProps) => (canInstall && !isStandalone
  ? (
    <HoverButton
      onClick={() => {
        promptToInstall();
      }}
      width="auto"
      bg="actionPrimary"
      color="surfaceInverse"
      hoverColor="surfaceInverse"
      hoverBg="actionPrimaryHover"
      transitionSpeed="0.2s"
      p="0.6rem 1.2rem"
    >
      INSTALL
    </HoverButton>
  )
  : null);

const mapStateToProps = (state: RootState) => ({
  canInstall: canInstallSelector(state),
});

export const InstallButton = connect(mapStateToProps)(InstallButtonComponent);
