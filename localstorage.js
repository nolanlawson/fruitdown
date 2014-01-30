function localStorage(dbname){
	this._partition = dbname;
	this._keys  = [];

	for (var i = 0; i < window.localStorage.length; i++){
    	if(window.localStorage.key(i).indexOf(dbname) == 0)
    		this._keys.push(window.localStorage.key(i))
    }
    this._keys.sort();
}

//key: Returns the name of the key at the position specified.
localStorage.prototype.key = function (keyindex){
		var retVal = this._keys[keyindex];
		if(typeof retVal !== 'undefined'){
            // this needs to be a last and first;
			return this._keys[keyindex].replace(this._partition + '!', "").replace("!bin");
		}else{
			return retVal;
		} 
}

//setItem: Saves and item at the key provided.
localStorage.prototype.setItem = function (key, value){    	
    	key = this._partition + "!" + key;
    	
        if(value instanceof ArrayBuffer || value instanceof Uint8Array) {
            value = String.fromCharCode.apply(null, value)
        }
    	
    	
    	for (var i = 0; i < this._keys.length; i++) {
	        if (this._keys[i] === key) {
	            window.localStorage.setItem(key, value);
	            return;
	        }
	    }

    	this._keys.push(key)
		this._keys.sort()
		window.localStorage.setItem(key, value);
	            
}

//getItem: Returns the item identified by it's key.
localStorage.prototype.getItem = function (key){
   key = this._partition + "!" + key
   var retval = window.localStorage.getItem(key) 
      if(retval == null){
         key += "!bin";
         retval = window.localStorage.getItem(key);
            if(retval == null){
               retval = undefined;
            }/*else {
                    charList = retval.split(''),
                    uintArray = [];
                    for (var i = 0; i < charList.length; i++) {
                        uintArray.push(charList[i].charCodeAt(0));
                    }
                return new Uint8Array(uintArray);
            }*/
            
    	}
    	return retval;
}

//removeItem: Removes the item identified by it's key.
localStorage.prototype.removeItem = function (key){
	key = this._partition + "!" + key
	
	for(var i = this._keys.length; i >= 0; i--) {
    	if(this._keys[i] === key) {
	       this._keys.splice(i, 1);
		   window.localStorage.removeItem(key);		
    	}
	}
}

    //clear: Removes all of the key value pairs.
localStorage.prototype.clear = function (){
	window.localStorage.clear()
}

localStorage.prototype.length = function(){

	return this._keys.length
}

exports.localStorage = localStorage;
