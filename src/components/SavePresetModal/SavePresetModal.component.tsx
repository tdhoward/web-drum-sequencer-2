import React from 'react';
import { ThemeContext } from 'styled-components';
import {
  TextInput,
  Text,
  Button,
  HoverButton,
  Form,
} from '../design-system';
import { Modal } from '../Modal.component';
import type { AppTheme } from '../../styles/theme';

type SavePresetModalComponentProps = {
  onClose: () => void;
  presetPromptOpen: boolean;
  onChangeNameField: React.ChangeEventHandler<HTMLInputElement>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  nameField: string;
  error?: string | null;
  inputId?: string;
  nameLabel?: string;
  submitLabel?: string;
};

export class SavePresetModalComponent extends React.Component<SavePresetModalComponentProps> {
  static contextType = ThemeContext;

  declare context: AppTheme;

  nameInput: HTMLInputElement | null = null;

  componentDidUpdate() {
    const { presetPromptOpen } = this.props;
    if (presetPromptOpen) {
      this.nameInput?.focus();
    }
  }

  render() {
    const {
      presetPromptOpen,
      nameField,
      onChangeNameField,
      onClose,
      onSubmit,
      error,
      inputId = 'preset-name',
      nameLabel = 'Kit Name',
      submitLabel = 'SAVE',
    } = this.props;
    const theme = this.context;
    return (
      <Modal show={presetPromptOpen}>
        <Form
          position="relative"
          display="flex"
          flexDirection="row"
          onSubmit={onSubmit}
        >
          <label htmlFor={inputId}>
            <Text color="surfaceInverse" fontSize={2} height="2rem">
              {nameLabel}
            </Text>
            <TextInput
              value={nameField}
              onChange={onChangeNameField}
              bg="surfaceInverse"
              fontSize={3}
              p={3}
              width="15em"
              id={inputId}
              placeholder="Enter name..."
              ref={(input) => { this.nameInput = input; }}
              boxShadow={error ? `inset 0 0 0 3px ${theme.colors.errorBorder}` : ''}
            />
          </label>
          <HoverButton
            bg="surfacePanelRaised"
            hoverBg="surfaceControlHover"
            color="surfaceInverse"
            transitionSpeed="0.1s"
            mt="2rem"
            borderRadius={0}
            p={0}
            width="4rem"
            type="submit"
          >
            {submitLabel}
          </HoverButton>
          <Button
            bg="transparent"
            color="textMuted"
            p={0}
            display="flex"
            justifyContent="space-between"
            onClick={onClose}
            fontSize={3}
            alignItems="center"
            alignSelf="center"
            position="absolute"
            right={0}
            top={0}
            width={20}
            height={20}
          >
            <svg width="20" height="20" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
              <path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z" fill="currentColor" />
            </svg>
          </Button>
        </Form>
      </Modal>
    );
  }
}
