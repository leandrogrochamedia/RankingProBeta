#!/bin/bash
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

SUPERVISOR_SCRIPT="$PROJECT_DIR/Ranking Pro - Supervisor.command"
DESIGNER_SCRIPT="$PROJECT_DIR/Ranking Pro - Designer.command"
DEVELOPER_SCRIPT="$PROJECT_DIR/Ranking Pro - Developer.command"

osascript <<APPLESCRIPT
tell application "Terminal"
  activate
  set projectPath to "$PROJECT_DIR"
  set supScript to "$SUPERVISOR_SCRIPT"
  set desScript to "$DESIGNER_SCRIPT"
  set devScript to "$DEVELOPER_SCRIPT"

  tell application "Finder"
    set sb to bounds of window of desktop
    set sx to item 1 of sb
    set sy to item 2 of sb
    set sw to (item 3 of sb) - sx
    set sh to (item 4 of sb) - sy
  end tell

  set topInset to 28
  set bottomInset to 48
  set sideInset to 12
  set gap to 6
  set paneW to round (sw * 0.25)
  set leftX to sx + sw - paneW - sideInset
  set rightX to sx + sw - sideInset
  set usableH to sh - topInset - bottomInset
  set paneH to (usableH - (gap * 2)) / 3

  -- Supervisor (top — 25% direita)
  do script "bash " & quoted form of supScript
  delay 0.45
  set custom title of front window to "Ranking Pro - Supervisor"
  set bounds of front window to {leftX, topInset, rightX, topInset + paneH}

  -- Designer (middle — 25% direita)
  do script "bash " & quoted form of desScript
  delay 0.45
  set custom title of front window to "Ranking Pro - Designer"
  set bounds of front window to {leftX, topInset + paneH + gap, rightX, topInset + (paneH * 2) + gap}

  -- Developer (bottom — 25% direita)
  do script "bash " & quoted form of devScript
  delay 0.45
  set custom title of front window to "Ranking Pro - Developer"
  set bounds of front window to {leftX, topInset + (paneH * 2) + (gap * 2), rightX, sh - bottomInset}
end tell
APPLESCRIPT