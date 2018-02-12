class Rotor {
	static get ALPHABET() { return "ABCDEFGHIJKLMNOPQRSTUVWXYZ" }
	
	constructor(base, turnover) {
		this.base = base ? base : ALPHABET;
		this.turnover = turnover ? turnover : (this.base.length - 1);
		this.offset = 0;
		this.position = 0;
		this.onTurnover = undefined;
	}
	
	apply(ch) {
		var pos = (Rotor.ALPHABET.indexOf(ch) + this.position - this.offset)%this.base.length;
		if (pos < 0) pos += this.base.length;
		
		var ch2 = ch && Rotor.ALPHABET.includes(ch)
			? Rotor.ALPHABET[(Rotor.ALPHABET.indexOf(this.base[pos]) + this.offset)%this.base.length]
			: undefined;
			
		var pos2 = Rotor.ALPHABET.indexOf(ch2) - this.position;
		if (pos2 < 0) pos2 += this.base.length;
		var ret = Rotor.ALPHABET[pos2];
		
		//console.log(ch, '>>', Rotor.ALPHABET[(pos + this.offset)%this.base.length], '->', ch2, '>>',  ret);
		return ret;
	}
	
	reverseApply(ch){
		var pos = (Rotor.ALPHABET.indexOf(ch) + this.position - this.offset)%this.base.length;
		if (pos < 0) pos += this.base.length;

		var ch2 = ch && Rotor.ALPHABET.includes(ch)
			? Rotor.ALPHABET[(this.base.indexOf(Rotor.ALPHABET[pos]) + this.offset)%this.base.length]
			: undefined;
		
		var pos2 = Rotor.ALPHABET.indexOf(ch2) - this.position;
		if (pos2 < 0) pos2 += this.base.length;
		var ret = Rotor.ALPHABET[pos2];
		
		//console.log(ch, '<<', Rotor.ALPHABET[(pos + this.offset)%this.base.length], '->', ch2, '<<',  ret);
		return ret
	}
	
	setOffset(pos) { this.offset = pos; }
	setPosition(pos) { this.position = pos; }
	
	incPosition() {
		if ((this.turnover instanceof Array && this.turnover.includes(this.position))
			|| this.position >= this.turnover)
			if (this.onTurnover) this.onTurnover();
		this.position++;
		if (this.position >= this.base.length)
			this.position = 0;
	}

	static get I()	{ return new Rotor("EKMFLGDQVZNTOWYHXUSPAIBRCJ", 17); }
	static get II()	{ return new Rotor("AJDKSIRUXBLHWTMCQGZNPYFVOE", 5); }
	static get III(){ return new Rotor("BDFHJLCPRTXVZNYEIWGAKMUSQO", 22); }
	//static get IV() { return new Rotor("", ); }
	
	static get B()  { return new Rotor("YRUHQSLDPXNGOKMIEBFZCWVJAT"); }
}

class Enigma {
	constructor(plugboard, rotors, reflector){
		this.rotors = [];
		this.plugboard = plugboard ? plugboard : {};
		this.reflector = reflector ? reflector : Rotor.ALPHABET;
		
		if ((rotors instanceof Array && rotors.length)||rotors.forEach) {
			this.rotors = rotors;
			for (let i = this.rotors.length - 1; i > 0; i--)
				this.combineRotors(this.rotors[i], this.rotors[i - 1]);
		}
	}
	
	combineRotors(rotorFrom, rotorTo){
		rotorFrom.onTurnover = function(i,o) {
			rotorTo.incPosition();
			return o;
		};
	}
	
	addRotor(rotor) {
		if (!rotor) return;
		if (this.rotors.unshift(rotor) > 1) 
			this.combineRotors(this.rotors[1], this.rotors[0]);
	}
	
	setRotors(rotorsSettings) {
		if (rotorsSettings instanceof Array && rotorsSettings.length >= this.rotors.length)
			this.rotors.forEach(function(rotor, i){
				rotor.setOffset(rotorsSettings[i]);
			});
	}
	
	setPosition(rotorsSettings) {
		if (rotorsSettings instanceof Array && rotorsSettings.length >= this.rotors.length)
			this.rotors.forEach(function(rotor, i){
				rotor.setPosition(rotorsSettings[i]);
			});
	}
	
	applyPlugboard(ch) {
		if (this.plugboard[ch]) return this.plugboard[ch];
		for (var prop in this.plugboard)
			if (this.plugboard.hasOwnProperty(prop) && this.plugboard[prop] === ch)
				return prop;
		return ch;
	}
	
	encrypt(msg) {
		var result = [];
		for (let i = 0; i < msg.length; i++) {
			var ch = msg[i].toUpperCase();
			ch = this.applyPlugboard(ch);
			if (this.rotors) this.rotors[this.rotors.length - 1].incPosition();
			//console.log("plugboard", ch);
			ch = this.rotors.reduceRight(function(el, rotor){
				return rotor.apply(el);
			}, ch);
			//console.log("rotors", ch);
			ch = this.reflector.apply(ch);
			//console.log("reflector", ch);
			ch = this.rotors.reduce(function(el, rotor){
				return rotor.reverseApply(el);
			}, ch);
			//console.log("rotors", ch);
			ch = this.applyPlugboard(ch);
			result.push(ch);
			//console.log("plugboard", ch)
			//console.log('----');
		}
		return result.join('');
	}
	
	getState() {
		return this.rotors.map(function(rotor){
			return rotor.position;
		});
	}
}

var enigma = new Enigma({}, [Rotor.I, Rotor.II, Rotor.III], Rotor.B);
enigma.setRotors([1, 1, 1]);
var msg = "this is a plaintext message";
var enc = enigma.encrypt(msg);
console.log(enc);
enigma.setPosition([0, 0, 0]);
var dec = enigma.encrypt(enc);
console.log(dec);