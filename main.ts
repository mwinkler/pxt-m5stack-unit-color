//% color=#0079B9 icon="\uf1fc" block="M5 Color"
namespace m5color {
	const TCS34725_ADDRESS = 0x29
	const TCS34725_COMMAND_BIT = 0x80

	const TCS34725_ENABLE = 0x00
	const TCS34725_ENABLE_AIEN = 0x10
	const TCS34725_ENABLE_WEN = 0x08
	const TCS34725_ENABLE_AEN = 0x02
	const TCS34725_ENABLE_PON = 0x01

	const TCS34725_ATIME = 0x01
	const TCS34725_WTIME = 0x03
	const TCS34725_CONTROL = 0x0F
	const TCS34725_ID = 0x12
	const TCS34725_STATUS = 0x13
	const TCS34725_CDATAL = 0x14
	const TCS34725_AILTL = 0x04
	const TCS34725_AILTH = 0x05
	const TCS34725_AIHTL = 0x06
	const TCS34725_AIHTH = 0x07
	const TCS34725_PERS = 0x0C
	const TCS34725_CONFIG = 0x0D
	const TCS34725_RDATAL = 0x16
	const TCS34725_GDATAL = 0x18
	const TCS34725_BDATAL = 0x1A

	export enum IntegrationTime {
		//% block="2.4 ms"
		ms2_4 = 0xFF,
		//% block="24 ms"
		ms24 = 0xF6,
		//% block="50 ms"
		ms50 = 0xEB,
		//% block="101 ms"
		ms101 = 0xD6,
		//% block="154 ms"
		ms154 = 0xC0,
		//% block="614 ms"
		ms614 = 0x00
	}

	export enum Gain {
		//% block="1x"
		x1 = 0x00,
		//% block="4x"
		x4 = 0x01,
		//% block="16x"
		x16 = 0x02,
		//% block="60x"
		x60 = 0x03
	}

	let _initialized = false
	let _integrationTime = IntegrationTime.ms2_4
	let _gain = Gain.x1
	let _address = TCS34725_ADDRESS

	interface RawColor {
		r: number
		g: number
		b: number
		c: number
	}

	function write8(reg: number, value: number) {
		const buf = pins.createBuffer(2)
		buf[0] = TCS34725_COMMAND_BIT | (reg & 0xFF)
		buf[1] = value & 0xFF
		pins.i2cWriteBuffer(_address, buf)
	}

	function read8(reg: number): number {
		pins.i2cWriteNumber(_address, TCS34725_COMMAND_BIT | (reg & 0xFF), NumberFormat.UInt8BE)
		return pins.i2cReadNumber(_address, NumberFormat.UInt8BE)
	}

	function read16(reg: number): number {
		pins.i2cWriteNumber(_address, TCS34725_COMMAND_BIT | (reg & 0xFF), NumberFormat.UInt8BE)
		const buf = pins.i2cReadBuffer(_address, 2)
		return (buf[1] << 8) | buf[0]
	}

	function enable() {
		write8(TCS34725_ENABLE, TCS34725_ENABLE_PON)
		basic.pause(3)
		write8(TCS34725_ENABLE, TCS34725_ENABLE_PON | TCS34725_ENABLE_AEN)
		basic.pause((256 - _integrationTime) * 12 / 5 + 1)
	}

	function ensureInit(): boolean {
		if (_initialized) return true
		init()
		return _initialized
	}

	function getRawInternal(): RawColor {
		if (!ensureInit()) return { r: 0, g: 0, b: 0, c: 0 }
		const c = read16(TCS34725_CDATAL)
		const r = read16(TCS34725_RDATAL)
		const g = read16(TCS34725_GDATAL)
		const b = read16(TCS34725_BDATAL)
		basic.pause((256 - _integrationTime) * 12 / 5 + 1)
		return { r, g, b, c }
	}

	/**
	 * Initialize the TCS34725 color sensor on the default I2C address (0x29).
	 * Must be called before reading color values.
	 */
	//% blockId=m5color_init
	//% block="initialize color sensor"
	//% weight=100 blockGap=8 group="Basic"
	export function init(): void {

		// PON cycle ensures the device is awake before ID read
		write8(TCS34725_ENABLE, TCS34725_ENABLE_PON)
		basic.pause(3)

		const id = read8(TCS34725_ID)
		if (id != 0x4D && id != 0x44 && id != 0x10) {
			_initialized = false
			return
		}

		_initialized = true
		setIntegrationTime(_integrationTime)
		setGain(_gain)
		enable()
	}

	/**
	 * Set the integration time for color measurement.
	 * Longer times provide more accurate readings but are slower.
	 * @param it the integration time in milliseconds
	 */
	//% blockId=m5color_set_integration
	//% block="set integration time %it"
	//% weight=90 blockGap=8 group="Basic"
	export function setIntegrationTime(it: IntegrationTime) {
		_integrationTime = it
		if (!_initialized) return
		write8(TCS34725_ATIME, _integrationTime)
	}

	/**
	 * Set the sensor gain (sensitivity multiplier).
	 * Higher gain is useful for dimmer light environments.
	 * @param gain the gain level (1x, 4x, 16x, or 60x)
	 */
	//% blockId=m5color_set_gain
	//% block="set gain %gain"
	//% weight=85 blockGap=8 group="Basic"
	export function setGain(gain: Gain) {
		_gain = gain
		if (!_initialized) return
		write8(TCS34725_CONTROL, _gain)
	}

	/**
	 * Get the raw red channel value (0-65535).
	 * @return the raw red channel reading
	 */
	//% blockId=m5color_raw_red
	//% block="raw red"
	//% weight=47 group="Advanced"
	export function red(): number {
		return getRawInternal().r
	}

	/**
	 * Get the raw green channel value (0-65535).
	 * @return the raw green channel reading
	 */
	//% blockId=m5color_raw_green
	//% block="raw green"
	//% weight=46 group="Advanced"
	export function green(): number {
		return getRawInternal().g
	}

	/**
	 * Get the raw blue channel value (0-65535).
	 * @return the raw blue channel reading
	 */
	//% blockId=m5color_raw_blue
	//% block="raw blue"
	//% weight=45 group="Advanced"
	export function blue(): number {
		return getRawInternal().b
	}

	/**
	 * Get the raw clear (luminosity) channel value (0-65535).
	 * Represents overall light intensity.
	 * @return the raw clear channel reading
	 */
	//% blockId=m5color_raw_clear
	//% block="raw clear"
	//% weight=44 blockGap=8 group="Advanced"
	export function clear(): number {
		return getRawInternal().c
	}

	/**
	 * Get the normalized RGB color as a hex color string.
	 * Values are normalized to 0-255 range and formatted as #RRGGBB.
	 * @return hex color string (e.g., "#FF0000" for red)
	 */
	//% blockId=m5color_rgb
	//% block="RGB as hex color"
	//% weight=70 blockGap=8 group="Basic"
	export function rgb(): string {
		const raw = getRawInternal()
		if (raw.c == 0) return "#000000"
		const scale = 255 / raw.c
		const r = Math.round(raw.r * scale)
		const g = Math.round(raw.g * scale)
		const b = Math.round(raw.b * scale)
		const hexChars = "0123456789ABCDEF"
		const toHex = (n: number) => {
			const high = Math.idiv(n, 16)
			const low = n - (high * 16)
			return hexChars.charAt(high) + hexChars.charAt(low)
		}
		return "#" + toHex(r) + toHex(g) + toHex(b)
	}

	/**
	 * Calculate the correlated color temperature in Kelvin.
	 * Estimates the warmth/coolness of the light: warm (~3000K) to cool (~6500K).
	 * @return color temperature in Kelvin
	 */
	//% blockId=m5color_temperature
	//% block="color temperature (K)"
	//% weight=65 blockGap=8 group="Basic"
	export function colorTemperature(): number {
		const raw = getRawInternal()
		return calculateColorTemperature(raw.r, raw.g, raw.b)
	}

	/**
	 * Calculate the illuminance (perceived brightness) in lux.
	 * Represents the light intensity level in the environment.
	 * @return illuminance in lux
	 */
	//% blockId=m5color_lux
	//% block="illuminance (lux)"
	//% weight=60 blockGap=8 group="Basic"
	export function lux(): number {
		const raw = getRawInternal()
		return calculateLux(raw.r, raw.g, raw.b)
	}

	/**
	 * Enable or disable the color sensor interrupt.
	 * When enabled, the sensor can trigger an interrupt when color values cross thresholds.
	 * @param enable true to enable interrupt, false to disable
	 */
	//% blockId=m5color_set_interrupt
	//% block="set color interrupt %enable"
	//% enable.shadow="toggleYesNo"
	//% weight=50 blockGap=8 group="Advanced"
	export function setInterrupt(enable: boolean): void {
		if (!ensureInit()) return
		const r = read8(TCS34725_ENABLE)
		const next = enable ? (r | TCS34725_ENABLE_AIEN) : (r & ~TCS34725_ENABLE_AIEN)
		write8(TCS34725_ENABLE, next)
	}

	/**
	 * Clear any pending color sensor interrupt.
	 * Call this after handling an interrupt event to reset the interrupt flag.
	 */
	//% blockId=m5color_clear_interrupt
	//% block="clear color interrupt"
	//% weight=49 blockGap=8 group="Advanced"
	export function clearInterrupt(): void {
		if (!ensureInit()) return
		const buf = pins.createBuffer(1)
		buf[0] = TCS34725_COMMAND_BIT | 0x66
		pins.i2cWriteBuffer(_address, buf)
	}

	/**
	 * Set the clear channel interrupt thresholds.
	 * An interrupt triggers when the clear channel value goes below the low threshold
	 * or above the high threshold. Enable interrupts with setInterrupt().
	 * @param low the lower threshold value (0-65535)
	 * @param high the upper threshold value (0-65535)
	 */
	//% blockId=m5color_set_interrupt_limits
	//% block="set interrupt low %low high %high"
	//% weight=48 blockGap=8 group="Advanced"
	export function setInterruptLimits(low: number, high: number): void {
		if (!ensureInit()) return
		write8(TCS34725_AILTL, low & 0xFF)
		write8(TCS34725_AILTH, (low >> 8) & 0xFF)
		write8(TCS34725_AIHTL, high & 0xFF)
		write8(TCS34725_AIHTH, (high >> 8) & 0xFF)
	}

	function calculateColorTemperature(r: number, g: number, b: number): number {
		if (r == 0 && g == 0 && b == 0) return 0
		const X = (-0.14282 * r) + (1.54924 * g) + (-0.95641 * b)
		const Y = (-0.32466 * r) + (1.57837 * g) + (-0.73191 * b)
		const Z = (-0.68202 * r) + (0.77073 * g) + (0.56332 * b)
		const sum = X + Y + Z
		if (sum == 0) return 0
		const xc = X / sum
		const yc = Y / sum
		const n = (xc - 0.3320) / (0.1858 - yc)
		const cct = (449 * Math.pow(n, 3)) + (3525 * Math.pow(n, 2)) + (6823.3 * n) + 5520.33
		return Math.idiv(Math.max(0, Math.round(cct)), 1)
	}

	function calculateLux(r: number, g: number, b: number): number {
		const illuminance = (-0.32466 * r) + (1.57837 * g) + (-0.73191 * b)
		return Math.idiv(Math.max(0, Math.round(illuminance)), 1)
	}
}
