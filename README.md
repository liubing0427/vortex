## jquery.vortex.js
###Make your elements in the page moving in a vortex
-------------------------------
### Demo
///TODO
-------------------------------
### `Integrating with your Application`

Load jquery.vortex.js and configure it:

```html
<script src="http://code.jquery.com/jquery.js"></script>
<script src="vortex.js"></script>
```

```javascript
$.vortex.init({
  operands: '.container'
});
```
-------------------------------
### `Requirements`	
* jQuery >= 1.7.0.

-------------------------------
### `Options`

key | option type / notes | default value | comments
----|---------|------|------
`operands` | string | `'img'` | the elements you want to operate, it will get all child elements which has no child
`vortex_prefix` | string | `"data-vortex-"` | use this to cache css as element attribute
`attributes` | array | `["position", "z-index", "top", "left", "width", "height", "transform", "-webkit-transform", "-moz-transform", "-ms-transform", "-o-transform"]` | the attributes need to cache
`browser_prefix` | array | `["-ms-", "-webkit-", "-moz-", "-o-", ""]` | supported browsers 
`showVortexLine` | boolean | `true` | whether shows the vortex line
`showCircle` | boolean | `true` | whether shows the black circle
`minScale` | number (0 to 1) | `0.5` | the minimum scale of the element
`moveAll` | boolean | `true` | whether moving the elements not in the vortex
`moveSpeed` | number | `1` | the speed moving element not in the vortex
-------------------------------
