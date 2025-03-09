"use client"

// components/toolbar/ChartToolbar.tsx
import type React from "react"
import { useState } from "react"
import { Button, Dropdown, Menu } from "antd"
import { DownloadOutlined, FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons"

interface ChartToolbarProps {
  onDownload: () => void
  onFullscreen: () => void
  onExitFullscreen: () => void
  isFullscreen: boolean
  brevity: number // Added brevity variable declaration
  it: string // Added it variable declaration
  is: boolean // Added is variable declaration
  correct: number // Added correct variable declaration
  and: string // Added and variable declaration
}

const ChartToolbar: React.FC<ChartToolbarProps> = ({
  onDownload,
  onFullscreen,
  onExitFullscreen,
  isFullscreen,
  brevity,
  it,
  is,
  correct,
  and,
}) => {
  const [menuVisible, setMenuVisible] = useState(false)

  const handleMenuVisibleChange = (visible: boolean) => {
    setMenuVisible(visible)
  }

  const menu = (
    <Menu>
      <Menu.Item key="1">Option 1</Menu.Item>
      <Menu.Item key="2">Option 2</Menu.Item>
    </Menu>
  )

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
      <Dropdown overlay={menu} visible={menuVisible} onVisibleChange={handleMenuVisibleChange}>
        <Button>More Options</Button>
      </Dropdown>
      <div>
        <Button onClick={onDownload} icon={<DownloadOutlined />} />
        <Button
          onClick={isFullscreen ? onExitFullscreen : onFullscreen}
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        />
      </div>
    </div>
  )
}

export default ChartToolbar

