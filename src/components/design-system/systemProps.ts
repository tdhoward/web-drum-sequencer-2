import type { CSSProperties } from 'react';
import type {
  AlignItemsProps,
  AlignSelfProps,
  BorderColorProps,
  BorderRadiusProps,
  BordersProps,
  BoxShadowProps,
  ColorProps,
  DisplayProps,
  FlexDirectionProps,
  FlexProps,
  FontFamilyProps,
  FontSizeProps,
  FontWeightProps,
  HeightProps,
  JustifyContentProps,
  LeftProps,
  LetterSpacingProps,
  LineHeightProps,
  MaxHeightProps,
  MaxWidthProps,
  MinHeightProps,
  MinWidthProps,
  OpacityProps,
  PositionProps,
  RightProps,
  SpaceProps,
  TextAlignProps,
  TopProps,
  BottomProps,
  VerticalAlignProps,
  WidthProps,
  ZIndexProps,
} from 'styled-system';

type UserSelectProps = {
  userSelect?: CSSProperties['userSelect'];
};

export type BoxProps =
  & ColorProps
  & SpaceProps
  & BordersProps
  & BorderColorProps
  & BorderRadiusProps
  & WidthProps
  & HeightProps
  & FlexProps
  & FlexDirectionProps
  & DisplayProps
  & JustifyContentProps
  & OpacityProps
  & PositionProps
  & AlignItemsProps
  & LeftProps
  & TopProps
  & BottomProps
  & RightProps
  & ZIndexProps
  & BoxShadowProps
  & MaxWidthProps
  & MinWidthProps
  & MaxHeightProps
  & MinHeightProps;

export type ButtonProps =
  & ColorProps
  & WidthProps
  & HeightProps
  & SpaceProps
  & BordersProps
  & BorderRadiusProps
  & FontWeightProps
  & FontSizeProps
  & AlignSelfProps
  & FlexProps
  & PositionProps
  & LeftProps
  & TopProps
  & BottomProps
  & RightProps
  & DisplayProps
  & AlignItemsProps
  & JustifyContentProps
  & OpacityProps
  & MinWidthProps
  & {
    outline?: string;
    variant?: string;
  };

export type FormProps = BoxProps;

export type HeadingProps =
  & ColorProps
  & FontSizeProps
  & FontWeightProps
  & SpaceProps
  & FontFamilyProps;

export type HoverButtonProps = ButtonProps & {
  transitionSpeed?: string;
  hoverColor?: string;
  hoverBg?: string;
  activeBg?: string;
  hoverOpacity?: number | string;
};

export type HoverLinkProps = OpacityProps & {
  transitionSpeed?: string;
  hoverOpacity?: number | string;
  activeOpacity?: number | string;
};

export type ImageProps =
  & ColorProps
  & SpaceProps
  & WidthProps
  & HeightProps
  & FlexProps
  & DisplayProps
  & JustifyContentProps
  & OpacityProps
  & PositionProps
  & UserSelectProps;

export type LabelProps =
  & ColorProps
  & FontWeightProps
  & FontSizeProps
  & SpaceProps
  & BorderRadiusProps
  & PositionProps
  & LeftProps
  & TopProps
  & LetterSpacingProps
  & HeightProps;

export type LineProps =
  & ColorProps
  & SpaceProps
  & BorderRadiusProps
  & WidthProps
  & HeightProps
  & FlexProps
  & DisplayProps
  & OpacityProps
  & PositionProps
  & AlignItemsProps;

export type TextProps =
  & ColorProps
  & FontWeightProps
  & FontSizeProps
  & SpaceProps
  & PositionProps
  & LeftProps
  & TopProps
  & LetterSpacingProps
  & HeightProps
  & ZIndexProps
  & BorderRadiusProps
  & TextAlignProps
  & OpacityProps
  & LineHeightProps
  & DisplayProps
  & VerticalAlignProps
  & UserSelectProps;

export type TextInputProps =
  & ColorProps
  & FontWeightProps
  & FontSizeProps
  & SpaceProps
  & PositionProps
  & ZIndexProps
  & WidthProps
  & HeightProps
  & BoxShadowProps
  & FlexProps
  & LineHeightProps;
