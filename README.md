## M5Stack Unit Color (TCS34725) — MakeCode Extension (Work in progress)

### Overview
- Provides blocks to read color and light from the TCS34725 sensor.
- Namespace: m5color
- Supports initialization, integration time, gain, RGB (hex), color temperature, lux, and interrupts.
- Based on the Adafruit TCS34725 reference driver: https://github.com/adafruit/Adafruit_TCS34725/blob/master/Adafruit_TCS34725.h

### Hardware
- Sensor: TCS34725 (M5Stack Unit Color)
- I2C address: 0x29
- Pins: 3.3V, GND, SCL, SDA
- Micro:bit default I2C: SCL=P19, SDA=P20

### Installation
- In MakeCode, open Extensions and import this repository.
- Initialize the sensor once at startup.

### Basic Blocks
- initialize color sensor: powers on and configures the device.
- RGB color (number): returns 24-bit 0xRRGGBB.
- color temperature (K): estimated CCT in Kelvin.
- illuminance (lux): brightness estimate in lux.

### Advanced Blocks
- set integration time: choose measurement duration.
- set gain: set sensitivity (1x/4x/16x/60x).
- set color interrupt: enable/disable interrupt.
- clear color interrupt: clear pending interrupt.
- set interrupt low/high: configure threshold limits.
- raw red/green/blue/clear: 16-bit channel values.

### Example (TypeScript)
```
// Initialize and read values
m5color.init()
m5color.setIntegrationTime(m5color.IntegrationTime.ms154)
m5color.setGain(m5color.Gain.x16)

const color = m5color.rgb() // 0xRRGGBB number
const cct = m5color.colorTemperature()
const lx = m5color.lux()

basic.showNumber(color)
basic.showNumber(cct)
basic.showNumber(lx)
```

### Notes
- Call m5color.init() before using the other blocks.
- Longer integration times yield more stable readings.
- Use Advanced raw channels when you need calibrated processing.
- The `rgb()` block returns a number (0xRRGGBB). To display as hex, format manually if needed.

