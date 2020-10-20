/*
By Anson from KittenbotHK
Adapting TEA5767 extension for microbit

MicroPython ESP8266/ESP32 driver for TEA5767 FM radio module:
https://github.com/alankrantas/micropython-TEA5767

TEA5767 Datasheet:
https://www.sparkfun.com/datasheets/Wireless/General/TEA5767.pdf
*/


//% color="#fcba03" weight=10 icon="\uf2ce"
//% groups='["TEA5767"]'
namespace TEA5767 {
  const range_US = [87.5, 108.0]
  const range_JP = [76.0, 91.0]

  const addr = 0x60
  let frequency = 88.1
  let band = 'US'
  let standby_mode = false
  let mute_mode = false
  let soft_mute_mode = true
  let search_mode = false
  let search_direction = 1
  let search_adc_level = 7
  let stereo_mode = true
  let noise_cancel = true
  let high_cut_mode = true
  let is_ready = false
  let is_stereo = true
  let signal_adc_level = 0
/**
     * Initialize Radio
*/
//% blockID=radio_init block="Initialization |%number"
//% weight=100
//% group="TEA5767"
  export function init(freq: number) {
    frequency = freq
    band = 'US'
    standby_mode = false
    mute_mode = false
    soft_mute_mode = true
    search_mode = false
    search_direction = 1
    search_adc_level = 7
    stereo_mode = true
    noise_cancel = true
    high_cut_mode = true
    is_ready = false
    is_stereo = true
    signal_adc_level = 0
    update()
  }
  /**
     * Get current frequency
  */
  //% blockID=radio_return block="Get frequency|%freq"
  //% weight=60
  //% group="TEA5767"
  export function return_frequency(): number{
    update()
    return frequency
  }
  /**
     * Set frequency
  */
  //% blockID=radio_setFreq block="Set frequency|%freq"
  //% weight=60
  //% group="TEA5767"
  export function set_frequency(freq: number) {
    frequency = freq
    update()
  }
  /**
     * Change frequency
  */
  //% blockID=radio_changeFreq block="Change frequency|%change"
  //% weight=60
  //% group="TEA5767"
  export function change_frequency(change: number) {
    frequency += change
    if (change >= 0) {
      search_direction = 1
    } else {
      search_direction = 0
    }
    update()
  }
  //% blockID=radio_search block="search|%mode|direction %dir|adc %adc"
  //% weight=60
  //% group="TEA5767"
  //% advanced=true
  export function search(mode: boolean, dir: number, adc: number) {
    search_mode = mode
    search_direction = dir
    if (adc == 10 || adc == 7 || adc == 5 || adc == 0) {
      search_adc_level = adc
    } else {
      search_adc_level = 7
    }
    update()
  }
  //% blockID=radio_mute block="mute|%mode"
  //% weight=60
  //% group="TEA5767"
  //% advanced=true
  export function mute(mode: boolean) {
    mute_mode = mode
    update()
  }
  //% blockID=radio_standby block="standby|%mode"
  //% weight=60
  //% group="TEA5767"
  //% advanced=true
  export function standby(mode: boolean) {
    standby_mode = mode
    update()
  }
  function read() {
    //reg: number
    //pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE)
    //let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE)
    let temp=pins.i2cReadBuffer(0x60,5)
    //let buf0=String(temp[0])
    let buf0=temp[0]+""
    //let buf1=String(temp[1])
    let buf1=temp[1]+""
    let buf01=buf0+buf1
    let freqB=parseInt(buf01,2)
    let freq= ((freqB*32768/4)-225000)/1000000
    freq=Math.round(freq*10)/10
    frequency=freq
    if(parseInt(buf0,2)>>7==1){
      is_ready=false
    }else{
      is_ready=true
    }
    if(parseInt(buf1,2)>>7==1){
      is_stereo=false
    }else{
      is_stereo=true
    }
    let buf3=temp[3]+""
    signal_adc_level=parseInt(buf3,2)>>4
  }
  function update() {
    let buf = pins.createBuffer(5)
    let cmd = ''
    if (band == 'US') {
      if (frequency < range_US[0]) {
        frequency = range_US[0]
      } else if (frequency > range_US[1]) {
        frequency = range_US[1]
      }
    }
    else {
      if (frequency < range_JP[0]) {
        frequency = range_JP[0]
      } else if (frequency > range_JP[1]) {
        frequency = range_JP[1]
      }
    }
    let freqB = (frequency * 1000000 + 225000) * 4 / 32768
    basic.showNumber(freqB)
    let freqH = Math.abs(freqB) >> 8
    let freqL = Math.abs(freqB) & 0xFF
    if (mute_mode) {
      cmd = '1'
    } else {
      cmd = '0'
    }
    if (search_mode) {
      cmd += '1'
    } else {
      cmd += '0'
    }
    buf[0] = Math.abs(freqH)
    buf[1] = freqL
    if (search_direction == 1) {
      cmd = '1'
    } else {
      cmd = '0'
    }
    if (search_adc_level == 10) {
      cmd += '11'
    } else if (search_adc_level == 7) {
      cmd += '10'
    } else if (search_adc_level == 5) {
      cmd += '01'
    } else {
      cmd += '00'
    }
    cmd += '1'
    if (stereo_mode) {
      cmd += '0'
    } else {
      cmd += '1'
    }
    cmd + '000'
    buf[2]=parseInt(cmd,2)
    cmd='0'
    if (standby_mode){
      cmd+='1'
    }else{
      cmd+='0'
    }
    if(band=='JP'){
      cmd+='1'
    }else{
      cmd+='0'
    }
    cmd+='1'
    if(soft_mute_mode){
      cmd+='1'
    }else{
      cmd+='0'
    }
    if(high_cut_mode){
      cmd+='1'
    }else{
      cmd+='0'
    }
    if(noise_cancel){
      cmd+='1'
    }else{
      cmd+='0'
    }
    cmd+='0'
    buf[3]=parseInt(cmd,2)
    buf[4]=0
    pins.i2cWriteBuffer(addr,buf)
    read()
  }
}
