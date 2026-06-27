#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import subprocess
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Iterable, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageChops


Color = Tuple[int, int, int]


def clamp01(v: float) -> float:
    return 0.0 if v < 0.0 else 1.0 if v > 1.0 else v


def clamp255(v: float) -> int:
    return max(0, min(255, int(round(v))))


def parse_color(text: str) -> Color:
    text = text.strip()
    if text.startswith("#"):
        text = text[1:]
    if len(text) == 3:
        text = "".join(ch * 2 for ch in text)
    if len(text) != 6:
        raise ValueError(f"Invalid color: {text!r}")
    return tuple(int(text[i:i + 2], 16) for i in (0, 2, 4))


def color_to_svg(color: Color) -> str:
    return f"rgb({color[0]},{color[1]},{color[2]})"


def mix(a: Color, b: Color, t: float) -> Color:
    t = clamp01(t)
    return tuple(clamp255(a[i] * (1.0 - t) + b[i] * t) for i in range(3))


def scale_color(c: Color, s: float) -> Color:
    return tuple(clamp255(v * s) for v in c)


def lighten(c: Color, amount: float) -> Color:
    return mix(c, (255, 255, 255), amount)


def darken(c: Color, amount: float) -> Color:
    return mix(c, (0, 0, 0), amount)


def with_alpha(color: Color, a: int) -> Tuple[int, int, int, int]:
    return color[0], color[1], color[2], a


@dataclass
class KnobTheme:
    frame_size: int = 96
    frame_count: int = 51
    start_angle: float = -140.0
    end_angle: float = 140.0
    supersample: int = 4

    knob_radius: float = 0.41
    knob_color: Color = (63, 74, 83)
    light_color: Color = (225, 235, 245)
    shadow_color: Color = (5, 7, 10)
    pointer_color: Color = (246, 246, 248)
    tick_color: Color = (202, 202, 204)
    background_color: Tuple[int, int, int, int] = (0, 0, 0, 0)

    shadow_thickness: float = 0.0
    shadow_opacity: float = 0.80
    shadow_blur: float = 0.020
    shadow_offset_x: float = 0.000
    shadow_offset_y: float = 0.035
    rim_width: float = 0.108
    face_radius: float = 0.315
    tick_radius: float = 0.445
    tick_length: float = 0.060
    tick_width: float = 0.030
    tick_count: int = 9
    tick_start_angle: float = -140.0
    tick_end_angle: float = 140.0
    pointer_radius: float = 0.195
    pointer_length: float = 0.050
    pointer_width: float = 0.140
    pointer_blur: float = 0.000
    pointer_corner_radius: float = 0.0
    bevel_strength: float = 0.90
    bevel_ring_width: float = 0.035
    face_ambient: float = 0.56
    face_diffuse: float = 0.48
    rim_ambient: float = 0.23
    rim_diffuse: float = 0.48

    @property
    def px(self) -> int:
        return self.frame_size * self.supersample

    @property
    def cx(self) -> float:
        return self.px / 2.0

    @property
    def cy(self) -> float:
        return self.px / 2.0

    @property
    def outer_radius_px(self) -> float:
        return self.px * self.knob_radius

    @property
    def face_radius_px(self) -> float:
        return self.px * self.face_radius

    @property
    def tick_radius_px(self) -> float:
        return self.px * self.tick_radius

    @property
    def tick_length_px(self) -> float:
        return self.px * self.tick_length

    @property
    def tick_width_px(self) -> float:
        return self.px * self.tick_width

    @property
    def pointer_radius_px(self) -> float:
        return self.px * self.pointer_radius

    @property
    def pointer_length_px(self) -> float:
        return self.px * self.pointer_length

    @property
    def pointer_width_px(self) -> float:
        return self.px * self.pointer_width


@dataclass
class DefaultKnobTheme(KnobTheme):
    pass


@dataclass
class CompactDarkKnobTheme(KnobTheme):
    knob_radius: float = 0.410
    face_radius: float = 0.320
    tick_radius: float = 0.430
    tick_color: Color = (180, 180, 184)
    pointer_color: Color = (250, 250, 252)
    shadow_offset_x: float = 0.000
    shadow_offset_y: float = 0.050


@dataclass
class BlueKnobTheme(KnobTheme):
    knob_color: Color = (38, 67, 92)
    light_color: Color = (205, 230, 250)
    shadow_color: Color = (3, 8, 15)
    tick_color: Color = (190, 210, 225)
    pointer_color: Color = (255, 255, 255)
    
    
@dataclass
class GoldenKnobTheme(KnobTheme):
    knob_color: Color = (110, 78, 24)
    light_color: Color = (255, 223, 140)
    shadow_color: Color = (28, 18, 6)
    tick_color: Color = (235, 214, 170)
    pointer_color: Color = (255, 245, 220)


@dataclass
class LightKnobTheme(KnobTheme):
    knob_color: Color = (212, 216, 222)
    light_color: Color = (255, 210, 180)
    shadow_color: Color = (120, 90, 75)
    pointer_color: Color = (120, 80, 62)
    tick_color: Color = (150, 156, 166)
    face_radius: float = 0.35
    shadow_opacity: float = 0.38
    shadow_blur: float = 0.050
    face_ambient: float = 0.72
    face_diffuse: float = 0.34
    rim_ambient: float = 0.38
    rim_diffuse: float = 0.34


THEME_CLASSES: dict[str, type[KnobTheme]] = {
    "default": DefaultKnobTheme,
    "compact-dark": CompactDarkKnobTheme,
    "blue": BlueKnobTheme,
    "golden": GoldenKnobTheme,
    "light": LightKnobTheme,
}

def angle_for_position(position: int, frame_count: int, start_angle: float, end_angle: float) -> float:
    if frame_count <= 1:
        return start_angle
    t = position / float(frame_count - 1)
    return start_angle + (end_angle - start_angle) * t


class KnobRenderer:
    def __init__(self, theme: KnobTheme):
        self.theme = theme
        self.base_frame_hi = self._render_base_highres()

    def render_frame(self, position: int) -> Image.Image:
        if not (0 <= position < self.theme.frame_count):
            raise ValueError(f"position must be between 0 and {self.theme.frame_count - 1}")
        hi = self.base_frame_hi.copy()
        self._draw_pointer(hi, position)
        return hi.resize((self.theme.frame_size, self.theme.frame_size), Image.LANCZOS)

    def render_strip(self) -> Image.Image:
        strip = Image.new(
            "RGBA",
            (self.theme.frame_size, self.theme.frame_size * self.theme.frame_count),
            self.theme.background_color,
        )
        for i in range(self.theme.frame_count):
            frame = self.render_frame(i)
            strip.paste(frame, (0, i * self.theme.frame_size), frame)
        return strip

    def _render_base_highres(self) -> Image.Image:
        t = self.theme
        img = Image.new("RGBA", (t.px, t.px), t.background_color)
        self._draw_ticks(img)
        self._draw_outer_shadow(img)
        self._draw_knob_body(img)
        self._draw_face_bevel(img)
        return img

    def _draw_ticks(self, img: Image.Image) -> None:
        t = self.theme
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))

        if t.tick_count == 1:
            angles = [(t.tick_start_angle + t.tick_end_angle) / 2.0]
        else:
            step = (t.tick_end_angle - t.tick_start_angle) / (t.tick_count - 1)
            angles = [t.tick_start_angle + i * step for i in range(t.tick_count)]

        for angle in angles:
            rad = math.radians(angle)
            cx = t.cx + math.sin(rad) * t.tick_radius_px
            cy = t.cy - math.cos(rad) * t.tick_radius_px

            tick_img = Image.new("RGBA", img.size, (0, 0, 0, 0))
            tick_draw = ImageDraw.Draw(tick_img)

            w = t.tick_width_px
            h = t.tick_length_px
            bbox = (cx - w / 2.0, cy - h / 2.0, cx + w / 2.0, cy + h / 2.0)
            tick_draw.rounded_rectangle(
                bbox,
                radius=w * 0.35,
                fill=with_alpha(t.tick_color, 255),
            )

            rotated = tick_img.rotate(-angle, center=(cx, cy), resample=Image.BICUBIC)
            overlay.alpha_composite(rotated)

        soft = overlay.filter(ImageFilter.GaussianBlur(radius=t.supersample * 0.18))
        img.alpha_composite(soft)
        img.alpha_composite(overlay)

    def _draw_outer_shadow(self, img: Image.Image) -> None:
        t = self.theme
        shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(shadow)

        rx = t.outer_radius_px * (1.0 + t.shadow_thickness * 0.35)
        ry = t.outer_radius_px * (1.0 + t.shadow_thickness * 0.90)

        offset_x = t.px * t.shadow_offset_x
        offset_y = t.px * t.shadow_offset_y

        bbox = (
            t.cx - rx + offset_x,
            t.cy - ry + offset_y,
            t.cx + rx + offset_x,
            t.cy + ry + offset_y,
        )

        draw.ellipse(
            bbox,
            fill=with_alpha(t.shadow_color, clamp255(255 * t.shadow_opacity)),
        )

        if t.shadow_blur > 0:
            shadow = shadow.filter(ImageFilter.GaussianBlur(radius=t.px * t.shadow_blur))

        img.alpha_composite(shadow)

    def _draw_knob_body(self, img: Image.Image) -> None:
        t = self.theme
        px = img.load()

        rim_base = darken(t.knob_color, 0.83)
        rim_light = mix(rim_base, t.light_color, 0.11)
        face_base = t.knob_color
        face_edge_shadow = darken(face_base, 0.30)

        lx, ly, lz = (-0.60, -0.70, 0.90)
        lm = math.sqrt(lx * lx + ly * ly + lz * lz)
        lx, ly, lz = lx / lm, ly / lm, lz / lm

        face_ratio = t.face_radius_px / t.outer_radius_px

        for y in range(t.px):
            ny = (y + 0.5 - t.cy) / t.outer_radius_px
            for x in range(t.px):
                nx = (x + 0.5 - t.cx) / t.outer_radius_px
                rr = math.hypot(nx, ny)
                if rr > 1.0:
                    continue

                if rr >= face_ratio:
                    nz = math.sqrt(max(0.0, 1.0 - min(1.0, rr * rr)))
                    diffuse = max(0.0, nx * lx + ny * ly + nz * lz)
                    edge_boost = clamp01((rr - 0.72) / 0.28)
                    brightness = t.rim_ambient + diffuse * t.rim_diffuse + edge_boost * 0.10
                    col = mix(scale_color(rim_base, brightness), rim_light, diffuse * 0.08)

                    purple_tint = (35, 26, 64)
                    if nx > 0.55 or nx < -0.55 or ny > 0.72:
                        tint_amt = clamp01(max(abs(nx) - 0.55, ny - 0.72) * 0.45)
                        col = mix(col, purple_tint, tint_amt * 0.18)

                    px[x, y] = (*col, 255)
                    continue

                fx = (x + 0.5 - t.cx) / t.face_radius_px
                fy = (y + 0.5 - t.cy) / t.face_radius_px
                fr = math.hypot(fx, fy)

                if fr <= 1.0:
                    fz = math.sqrt(max(0.0, 1.0 - min(1.0, fr * fr)))
                    diffuse = max(0.0, fx * lx + fy * ly + fz * lz)
                    brightness = t.face_ambient + diffuse * t.face_diffuse

                    radial_shadow = clamp01((fr - 0.70) / 0.30)
                    lower_shadow = clamp01((fy + 0.10) * 0.55 + (fx + 0.10) * 0.25)

                    brightness *= 1.0 - radial_shadow * 0.12
                    base = scale_color(face_base, brightness)
                    base = mix(base, face_edge_shadow, radial_shadow * 0.18 + lower_shadow * 0.08)

                    px[x, y] = (*base, 255)

    def _draw_face_bevel(self, img: Image.Image) -> None:
        t = self.theme

        # Build a vertical RGBA gradient:
        # top = light color
        # middle = transparent
        # bottom = shadow color
        gradient = Image.new("RGBA", img.size, (0, 0, 0, 0))
        gpix = gradient.load()

        top_alpha = 0.90 * t.bevel_strength
        bottom_alpha = 0.34 * t.bevel_strength

        for y in range(t.px):
            u = y / (t.px - 1) if t.px > 1 else 0.0

            if u <= 0.5:
                # Fade from light color at top to transparent at center
                k = 1.0 - (u / 0.5)
                color = t.light_color
                alpha = clamp255(255 * top_alpha * k)
            else:
                # Fade from transparent at center to shadow color at bottom
                k = (u - 0.5) / 0.5
                color = t.shadow_color
                alpha = clamp255(255 * bottom_alpha * k)

            rgba = (color[0], color[1], color[2], alpha)
            for x in range(t.px):
                gpix[x, y] = rgba

        # Create an annular mask (ring) around the edge of the face
        ring_mask = Image.new("L", img.size, 0)
        draw = ImageDraw.Draw(ring_mask)

        outer_r = t.face_radius_px
        ring_w = t.px * t.bevel_ring_width
        inner_r = max(0.0, outer_r - ring_w)

        outer_bbox = (
            t.cx - outer_r,
            t.cy - outer_r,
            t.cx + outer_r,
            t.cy + outer_r,
        )
        inner_bbox = (
            t.cx - inner_r,
            t.cy - inner_r,
            t.cx + inner_r,
            t.cy + inner_r,
        )

        draw.ellipse(outer_bbox, fill=255)
        draw.ellipse(inner_bbox, fill=0)

        # Slight blur softens the ring edges
        ring_mask = ring_mask.filter(
            ImageFilter.GaussianBlur(radius=t.px * 0.006)
        )

        # Combine the ring mask with the gradient alpha
        gradient_alpha = gradient.getchannel("A")
        final_alpha = ImageChops.multiply(gradient_alpha, ring_mask)
        gradient.putalpha(final_alpha)

        img.alpha_composite(gradient)

    def _draw_pointer(self, img: Image.Image, position: int) -> None:
        t = self.theme
        angle = angle_for_position(position, t.frame_count, t.start_angle, t.end_angle)
        rad = math.radians(angle)

        cx = t.cx + math.sin(rad) * t.pointer_radius_px
        cy = t.cy - math.cos(rad) * t.pointer_radius_px
        pointer_angle = angle + 90.0

        pointer_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        shadow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))

        pw = t.pointer_width_px
        pl = t.pointer_length_px

        bbox = (
            cx - pw / 2.0,
            cy - pl / 2.0,
            cx + pw / 2.0,
            cy + pl / 2.0,
        )

        shade_box = (
            cx - pw * 0.48,
            cy - pl * 0.48 + t.px * 0.005,
            cx + pw * 0.48,
            cy + pl * 0.48 + t.px * 0.005,
        )

        corner_radius = t.pointer_width_px * t.pointer_corner_radius

        pointer_draw = ImageDraw.Draw(pointer_layer)
        shadow_draw = ImageDraw.Draw(shadow_layer)

        if corner_radius <= 0:
            pointer_draw.rectangle(
                bbox,
                fill=with_alpha(t.pointer_color, 255),
            )

            shadow_draw.rectangle(
                shade_box,
                fill=with_alpha(mix(t.shadow_color, t.pointer_color, 0.20), 150),
            )
        else:
            pointer_draw.rounded_rectangle(
                bbox,
                radius=corner_radius,
                fill=with_alpha(t.pointer_color, 255),
            )

            shadow_draw.rounded_rectangle(
                shade_box,
                radius=corner_radius,
                fill=with_alpha(mix(t.shadow_color, t.pointer_color, 0.20), 150),
            )

        shadow_layer = shadow_layer.rotate(
            -pointer_angle,
            center=(cx, cy),
            resample=Image.BICUBIC,
        )

        if t.pointer_blur > 0:
            shadow_layer = shadow_layer.filter(
                ImageFilter.GaussianBlur(radius=t.px * t.pointer_blur * 0.9),
            )

        img.alpha_composite(shadow_layer)

        pointer_layer = pointer_layer.rotate(
            -pointer_angle,
            center=(cx, cy),
            resample=Image.BICUBIC,
        )

        if t.pointer_blur > 0:
            soft_glow = pointer_layer.filter(
                ImageFilter.GaussianBlur(radius=t.px * t.pointer_blur),
            )
            img.alpha_composite(soft_glow)

        img.alpha_composite(pointer_layer)


def svg_for_frame(theme: KnobTheme, position: int) -> str:
    return svg_document(theme, [position], single_frame=True)


def svg_for_strip(theme: KnobTheme) -> str:
    return svg_document(theme, range(theme.frame_count), single_frame=False)


def svg_document(theme: KnobTheme, positions: Iterable[int], single_frame: bool) -> str:
    width = theme.frame_size
    height = theme.frame_size if single_frame else theme.frame_size * theme.frame_count

    cx = cy = theme.frame_size / 2.0
    outer_r = theme.frame_size * theme.knob_radius
    face_r = theme.frame_size * theme.face_radius
    tick_r = theme.frame_size * theme.tick_radius
    tick_len = theme.frame_size * theme.tick_length
    tick_w = theme.frame_size * theme.tick_width
    ptr_r = theme.frame_size * theme.pointer_radius
    ptr_len = theme.frame_size * theme.pointer_length
    ptr_w = theme.frame_size * theme.pointer_width

    if theme.tick_count == 1:
        tick_angles = [(theme.tick_start_angle + theme.tick_end_angle) / 2.0]
    else:
        step = (theme.tick_end_angle - theme.tick_start_angle) / (theme.tick_count - 1)
        tick_angles = [theme.tick_start_angle + i * step for i in range(theme.tick_count)]

    frame_groups = []

    for index, pos in enumerate(positions):
        y_offset = 0 if single_frame else index * theme.frame_size
        tick_parts = []

        for angle in tick_angles:
            rad = math.radians(angle)
            tx = cx + math.sin(rad) * tick_r
            ty = cy - math.cos(rad) * tick_r + y_offset

            tick_parts.append(
                f'<rect x="{tx - tick_w / 2:.3f}" y="{ty - tick_len / 2:.3f}" '
                f'width="{tick_w:.3f}" height="{tick_len:.3f}" '
                f'rx="{tick_w * 0.35:.3f}" '
                f'fill="{color_to_svg(theme.tick_color)}" '
                f'transform="rotate({angle:.3f} {tx:.3f} {ty:.3f})" />'
            )

        angle = angle_for_position(pos, theme.frame_count, theme.start_angle, theme.end_angle)
        rad = math.radians(angle)
        px = cx + math.sin(rad) * ptr_r
        py = cy - math.cos(rad) * ptr_r + y_offset
        pa = angle + 90.0

        frame_groups.append(
            f"""
  <g>
    {''.join(tick_parts)}

    <ellipse cx="{cx + theme.frame_size * theme.shadow_offset_x:.3f}"
            cy="{cy + y_offset + theme.frame_size * theme.shadow_offset_y:.3f}"
            rx="{outer_r * (1.0 + theme.shadow_thickness * 0.35):.3f}"
            ry="{outer_r * (1.0 + theme.shadow_thickness * 0.90):.3f}"
            fill="{color_to_svg(theme.shadow_color)}"
            fill-opacity="{theme.shadow_opacity:.3f}"
            filter="url(#blurShadow)" />

    <circle cx="{cx:.3f}"
            cy="{cy + y_offset:.3f}"
            r="{outer_r:.3f}"
            fill="url(#rimGradient)" />

    <circle cx="{cx:.3f}"
            cy="{cy + y_offset:.3f}"
            r="{face_r:.3f}"
            fill="url(#faceGradient)" />

    <path d="M {cx - face_r * 0.82:.3f},{cy + y_offset - face_r * 0.70:.3f}
             A {face_r:.3f},{face_r:.3f} 0 0,1 {cx + face_r * 0.65:.3f},{cy + y_offset - face_r * 0.08:.3f}"
          fill="none"
          stroke="{color_to_svg(mix(theme.light_color, theme.knob_color, 0.15))}"
          stroke-opacity="0.60"
          stroke-width="{theme.frame_size * 0.032:.3f}"
          stroke-linecap="round"
          filter="url(#blurEdge)" />

    <path d="M {cx + face_r * 0.90:.3f},{cy + y_offset + face_r * 0.10:.3f}
             A {face_r:.3f},{face_r:.3f} 0 0,1 {cx - face_r * 0.55:.3f},{cy + y_offset + face_r * 0.82:.3f}"
          fill="none"
          stroke="{color_to_svg(mix(theme.shadow_color, theme.knob_color, 0.10))}"
          stroke-opacity="0.42"
          stroke-width="{theme.frame_size * 0.026:.3f}"
          stroke-linecap="round"
          filter="url(#blurEdge)" />

    <ellipse cx="{cx - face_r * 0.30:.3f}"
             cy="{cy + y_offset - face_r * 0.28:.3f}"
             rx="{face_r * 0.66:.3f}"
             ry="{face_r * 0.44:.3f}"
             fill="{color_to_svg(theme.light_color)}"
             fill-opacity="0.10"
             filter="url(#blurGloss)" />

    <rect x="{px - ptr_w / 2:.3f}"
          y="{py - ptr_len / 2:.3f}"
          width="{ptr_w:.3f}"
          height="{ptr_len:.3f}"
          rx="{ptr_w * theme.pointer_corner_radius:.3f}"
          fill="{color_to_svg(theme.pointer_color)}"
          transform="rotate({pa:.3f} {px:.3f} {py:.3f})"
          filter="url(#blurPointer)" />

    <rect x="{px - ptr_w / 2:.3f}"
          y="{py - ptr_len / 2:.3f}"
          width="{ptr_w:.3f}"
          height="{ptr_len:.3f}"
          rx="{ptr_w * 0.60:.3f}"
          fill="{color_to_svg(theme.pointer_color)}"
          transform="rotate({pa:.3f} {px:.3f} {py:.3f})" />
  </g>
"""
        )

    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="{width}"
     height="{height}"
     viewBox="0 0 {width} {height}">
  <defs>
    <radialGradient id="rimGradient" cx="35%" cy="28%" r="78%">
      <stop offset="0%" stop-color="{color_to_svg(mix(darken(theme.knob_color, 0.83), theme.light_color, 0.12))}" />
      <stop offset="60%" stop-color="{color_to_svg(darken(theme.knob_color, 0.83))}" />
      <stop offset="100%" stop-color="{color_to_svg(mix(darken(theme.knob_color, 0.85), (35, 26, 64), 0.18))}" />
    </radialGradient>

    <radialGradient id="faceGradient" cx="35%" cy="25%" r="82%">
      <stop offset="0%" stop-color="{color_to_svg(lighten(theme.knob_color, 0.15))}" />
      <stop offset="70%" stop-color="{color_to_svg(theme.knob_color)}" />
      <stop offset="100%" stop-color="{color_to_svg(darken(theme.knob_color, 0.22))}" />
    </radialGradient>

    <filter id="blurShadow">
      <feGaussianBlur stdDeviation="{theme.frame_size * theme.shadow_blur:.3f}" />
    </filter>

    <filter id="blurEdge">
      <feGaussianBlur stdDeviation="{theme.frame_size * 0.009:.3f}" />
    </filter>

    <filter id="blurGloss">
      <feGaussianBlur stdDeviation="{theme.frame_size * 0.020:.3f}" />
    </filter>

    <filter id="blurPointer">
      <feGaussianBlur stdDeviation="{theme.frame_size * theme.pointer_blur * 0.55:.3f}" />
    </filter>
  </defs>

  {''.join(frame_groups)}
</svg>
"""
    return svg


def maybe_render_png_with_inkscape(svg_path: Path, png_path: Path, inkscape_exe: str = "inkscape") -> None:
    cmd = [inkscape_exe, str(svg_path), f"--export-filename={png_path}"]
    subprocess.run(cmd, check=True)


def build_arg_parser(default_theme: KnobTheme, default_style: str) -> argparse.ArgumentParser:
    d = default_theme

    p = argparse.ArgumentParser(
        description="Generate WDS knob skins.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    p.add_argument(
        "--style",
        choices=THEME_CLASSES.keys(),
        default=default_style,
        help="Theme style to use as the default parameter set.",
    )

    # Keep the rest of your existing arguments here.
    # Their defaults should continue to use d.whatever.

    mode = p.add_mutually_exclusive_group()
    mode.add_argument("--frame", type=int, help="Generate one frame, from 0 to 50 by default.")
    mode.add_argument("--strip", action="store_true", help="Generate the full vertical strip.")

    p.add_argument("--png", type=str, help="PNG output path.")
    p.add_argument("--svg", type=str, help="SVG output path.")
    p.add_argument(
        "--renderer",
        choices=["pillow", "inkscape"],
        default="pillow",
        help="How to create PNG when both SVG and PNG are requested.",
    )
    p.add_argument("--inkscape", type=str, default="inkscape", help="Inkscape executable name or path.")

    p.add_argument("--frame-size", type=int, default=d.frame_size)
    p.add_argument("--frame-count", type=int, default=d.frame_count)
    p.add_argument("--start-angle", type=float, default=d.start_angle)
    p.add_argument("--end-angle", type=float, default=d.end_angle)
    p.add_argument("--supersample", type=int, default=d.supersample)

    p.add_argument(
        "--knob-radius",
        type=float,
        default=d.knob_radius,
        help="Outer knob radius as a fraction of frame size.",
    )

    p.add_argument(
        "--face-radius",
        type=float,
        default=d.face_radius,
        help="Inner knob face radius as a fraction of frame size.",
    )

    p.add_argument("--knob-color", type=str, default="#%02x%02x%02x" % d.knob_color)
    p.add_argument("--light-color", type=str, default="#%02x%02x%02x" % d.light_color)
    p.add_argument("--shadow-color", type=str, default="#%02x%02x%02x" % d.shadow_color)
    p.add_argument("--pointer-color", type=str, default="#%02x%02x%02x" % d.pointer_color)
    p.add_argument("--tick-color", type=str, default="#%02x%02x%02x" % d.tick_color)

    p.add_argument("--shadow-thickness", type=float, default=d.shadow_thickness)
    p.add_argument("--shadow-opacity", type=float, default=d.shadow_opacity)
    p.add_argument("--shadow-blur", type=float, default=d.shadow_blur)
    p.add_argument("--shadow-offset-x", type=float, default=d.shadow_offset_x)
    p.add_argument("--shadow-offset-y", type=float, default=d.shadow_offset_y)

    p.add_argument("--tick-count", type=int, default=d.tick_count)
    p.add_argument("--tick-start-angle", type=float, default=d.tick_start_angle)
    p.add_argument("--tick-end-angle", type=float, default=d.tick_end_angle)
    p.add_argument("--tick-length", type=float, default=d.tick_length)
    p.add_argument("--tick-width", type=float, default=d.tick_width)
    p.add_argument("--tick-radius", type=float, default=d.tick_radius)

    p.add_argument("--pointer-radius", type=float, default=d.pointer_radius)
    p.add_argument("--pointer-length", type=float, default=d.pointer_length)
    p.add_argument("--pointer-width", type=float, default=d.pointer_width)
    p.add_argument("--pointer-blur", type=float, default=d.pointer_blur)
    p.add_argument("--pointer-corner-radius", type=float, default=d.pointer_corner_radius)
    
    p.add_argument("--bevel-ring-width", type=float, default=d.bevel_ring_width)

    return p


def theme_from_args(args: argparse.Namespace, default_theme: KnobTheme) -> KnobTheme:
    return replace(
        default_theme,
        frame_size=args.frame_size,
        frame_count=args.frame_count,
        start_angle=args.start_angle,
        end_angle=args.end_angle,
        supersample=args.supersample,
        knob_radius=args.knob_radius,
        face_radius=args.face_radius,
        knob_color=parse_color(args.knob_color),
        light_color=parse_color(args.light_color),
        shadow_color=parse_color(args.shadow_color),
        pointer_color=parse_color(args.pointer_color),
        tick_color=parse_color(args.tick_color),
        shadow_thickness=args.shadow_thickness,
        shadow_opacity=args.shadow_opacity,
        shadow_blur=args.shadow_blur,
        shadow_offset_x=args.shadow_offset_x,
        shadow_offset_y=args.shadow_offset_y,
        tick_count=args.tick_count,
        tick_start_angle=args.tick_start_angle,
        tick_end_angle=args.tick_end_angle,
        tick_length=args.tick_length,
        tick_width=args.tick_width,
        tick_radius=args.tick_radius,
        pointer_radius=args.pointer_radius,
        pointer_length=args.pointer_length,
        pointer_width=args.pointer_width,
        pointer_blur=args.pointer_blur,
        pointer_corner_radius=args.pointer_corner_radius,
        bevel_ring_width=args.bevel_ring_width,
    )


def ensure_parent(path: str | None) -> None:
    if not path:
        return
    Path(path).parent.mkdir(parents=True, exist_ok=True)


def get_requested_style() -> str:
    style_parser = argparse.ArgumentParser(add_help=False)
    style_parser.add_argument(
        "--style",
        choices=THEME_CLASSES.keys(),
        default="default",
    )
    args, _ = style_parser.parse_known_args()
    return args.style


def main() -> None:
    default_style = get_requested_style()
    default_theme = THEME_CLASSES[default_style]()

    parser = build_arg_parser(default_theme, default_style)
    args = parser.parse_args()

    theme = theme_from_args(args, default_theme)
    render_strip = args.strip or args.frame is None

    if not args.png and not args.svg:
        if render_strip:
            args.png = "knob_strip.png"
        else:
            args.png = f"knob_frame_{args.frame:02d}.png"

    renderer = KnobRenderer(theme)

    if args.svg:
        ensure_parent(args.svg)
        svg_text = svg_for_strip(theme) if render_strip else svg_for_frame(theme, args.frame)
        Path(args.svg).write_text(svg_text, encoding="utf-8")

    if args.png:
        ensure_parent(args.png)
        if args.renderer == "inkscape" and args.svg:
            maybe_render_png_with_inkscape(Path(args.svg), Path(args.png), args.inkscape)
        else:
            image = renderer.render_strip() if render_strip else renderer.render_frame(args.frame)
            image.save(args.png)


if __name__ == "__main__":
    main()