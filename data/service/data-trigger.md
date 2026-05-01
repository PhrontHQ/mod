## DataTrigger._setValue / DataTrigger._getValue requirements

### _setValue

#### Callers
- _getValue: `this._setValue(object, /*value*/initValue, /*_dispatchChange*/(_initialValue !== undefined) ? true : false, /*_initialValue*/undefined, /*_currentValue*/undefined);`
- Base setter: `trigger._setValue(this, value);`
OR 
`DataTrigger._setValue(this, value, _dispatchChange, _initialValue, _currentValue);`
	- `ExpressionDataMapping._assignObjectValueOrDefault()`
		- if property is toMany and value is null
			- propertySetter.call(object, /*value*/value, /*_dispatchChange*/ true, /*_initialValue*/ value, /*_currentValue*/undefined)


#### Logic

- Get value on object 
- If value on object matches new value and this isn’t a “specialty” set, exit
- Set new value on object
    - Via internal setter if it exists
    - Via splice if an array
    - Via loop on keys/values if a Map
- Get new value on object
- Add range observer 
- Dispatch change


### _getValue

#### Callers
- Base getter: `trigger._getValue(this, shouldFetch);`

- `DataTrigger._setValue` 
   - At the top: `this._getValue(object,  /*shouldFetch*/false, /*_initialValue*/value);` 
	  - Only called when it’s not a “specialty” `_setValue`. e.g. arguments.length < 5. 
After setting: this._getValue(object, shouldFetch)

#### Logic
 
- Fetch objectProperty 
    - if shouldFetch != false
        - shouldFetch = false when
            - Called from top of _setValue
        - later in _setValue: shouldFetch = arguments.length >= 4 && _initialValue === undefined;
        - Passed into main getter 
    - It hasn’t been set before (this._getValueStatus(object) !== null
    - It’s not derived 
    - Object isn’t newly created
- ensuresCollectionValue
    - If property isn’t defined / isMandatory and null
        - Use _initialValue if provided and Initialize new instance of class
    - Assign value to object
        - Don’t dispatch if empty



 

### Additional Notes / Scratch Pad

_getValue that triggers _setValue

_getValue
	_ensureCollectionValue(object, _initialValue)
            this._setValue(object, /*value*/initValue, /*_dispatchChange*/(_initialValue && ((_initialValue.length === undefined ? _initialValue.size :_initialValue.length) > 0)) ? true : false, /*_initialValue*/undefined, /*_currentValue*/undefined);







Cases we need to handle 



1. Called from standard setter `object[this._propertyName] = value`
    1. value is []
        2. 