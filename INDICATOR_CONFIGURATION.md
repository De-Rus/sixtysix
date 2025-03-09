# Indicator Configuration System

This document explains the indicator configuration system in the trading chart library, focusing on how indicator parameters are defined, displayed, and updated.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Parameter Types](#parameter-types)
- [Configuration Dialog](#configuration-dialog)
- [Data Flow](#data-flow)
- [Implementation Examples](#implementation-examples)
- [Advanced Configuration](#advanced-configuration)

## Architecture Overview

The indicator configuration system consists of several key components:

1. **Indicator Parameter Definition**: Parameters are defined in the indicator class
2. **Configuration Dialog**: UI component for editing parameters
3. **Parameter Storage**: State management for indicator configurations
4. **Parameter Application**: Applying configuration changes to indicators

### Key Files

- `components/indicator-config-dialog.tsx` - The configuration dialog UI
- `utils/indicators/configurable-indicator.ts` - Interface for configurable indicators
- `components/chart-toolbar.tsx` - Manages indicator selection and configuration
- `utils/chart-indicators.ts` - Applies configurations when generating plots

## Parameter Types

The system supports the following parameter types:

| Type | Description | UI Component | Example |
|------|-------------|-------------|---------|
| `number` | Numeric values | Input with min/max/step | Period, multiplier |
| `boolean` | True/false values | Checkbox | Show/hide elements |
| `string` | Text values | Text input | Custom labels |
| `select` | Selection from options | Dropdown | Calculation method |
| `color` | Color values | Color picker | Line colors |

### Parameter Definition

Parameters are defined using the `IndicatorParameter` interface:

```typescript
interface IndicatorParameter {
  name: string;        // Unique identifier
  type: string;        // "number", "boolean", "string", "select", "color"
  label: string;       // Display name
  value: any;          // Current value
  min?: number;        // For number: minimum value
  max?: number;        // For number: maximum value
  step?: number;       // For number: step increment
  options?: {          // For select: available options
    label: string;
    value: string;
  }[];
}

