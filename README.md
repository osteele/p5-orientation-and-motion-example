# JavaScript Motion and Orientation Demo (in P5)

This is a demonstration of the [device motion and orientation JavaScript
APIs][Detecting Device Orientation], that read accelerometer data from a mobile
device.

You may interact with the page at <https://osteele.github.io/p5-orientation-and-motion-example/>.

The motion and orientation data is displayed in three ways:

- All motion and orientation values are displayed in textual form
- A ball moves around the screen in response to the accelerometer
- A compass displays the heading and the heading accuracy

(The ball rotation is simply a frill, and does not directly relate to any sensor
value.)

The code uses [p5.js](https://p5js.org).

## Development Instructions

Note that the page needs to *served* over HTTPS, and *viewed* on a mobile device.

Two ways to do this are:

- Publish the file to GitHub Pages, Netlify, or Vercel. (This is a very slow
  development cycle.)

- (a) Serve the project from your laptop. For example, open it in Visual Studio
  Code, and use the Live Server extension. (b) Use ngrok to create an HTTPS
  address for it. (c) Visit the `https://` URL on your phone.

This doesn't work:

- Run the program in OpenProcessing.org. (This doesn't work because “Source
  frame did not have the same security origin as the main page.”)

I haven't tried serving the code from Glitch, JSFiddle, or CodePen.

## Gotchas

- The `devicemotion` and `deviceorientation` event listeners may only be added
  from then `then` of a call to `DeviceMotionEvent.requestPermission`.
- The call to `DeviceMotionEvent.requestPermission` needs to occur the handler
  of a user gesture, such as a mouse click or key press.
- Some example code on the web assigns to `window.ondevicemotion` instead of
  adding calling `addEventListener`. This has the same limitations as calling
  `addEventListener` with these event names.
- JavaScript code that listens to the motion and orientation events only works
  if it is (1) served from `localhost` or `127.0.0.1`, *or* (2) served via
  HTTPS. See the Instructions, above.

## References

MDN Articles:

- [Detecting Device
  Orientation]
- [Orientation and Motion Data
  Explained](https://developer.mozilla.org/en-US/docs/Web/Events/Orientation_and_motion_data_explained)
- [DeviceOrientationEvent
  reference](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
- [DeviceMotionEvent
  reference](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent)

Other documentation:

- [Google Developer Docs: Device Orientation & Motion](https://developers.google.com/web/fundamentals/native-hardware/device-orientation/)
- [Apple Developer Documentation: Device Orientation Event](https://developer.apple.com/documentation/webkitjs/deviceorientationevent)
- [Apple Developer Documentation: Device Motion Event](https://developer.apple.com/documentation/webkitjs/devicemotionevent)

[Detecting Device Orientation]: https://developer.mozilla.org/en-US/docs/Web/Events/Detecting_device_orientation

## License

MIT
