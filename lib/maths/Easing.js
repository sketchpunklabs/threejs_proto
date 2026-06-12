//http://easings.net/
//Easing functions from https://github.com/tweenjs/tween.js/blob/master/src/Tween.js

// https://github.com/lordofduct/spacepuppy-unity-framework/blob/master/SpacepuppyBase/Tween/Easing.cs

// https://www.febucci.com/2018/08/easing-functions/

// https://www.youtube.com/watch?v=mr5xkf6zSzk VERY GOOD

// https://realtimevfx.com/uploads/default/original/2X/1/1ff761b19b6df461fc5befeab1e8f979ba17a040.png

// https://github.com/julianshapiro/velocity/blob/master/src/Velocity/easing/bezier.ts
// https://github.com/julianshapiro/velocity/blob/master/src/Velocity/easing/bezier.ts

export default class Easing{
	//-----------------------------------------------
	static quadIn( k ){ return k * k; }
	static quadOut( k ){ return k * (2 - k); }
	static quadInOut( k ) {
		if ((k *= 2) < 1) return 0.5 * k * k;
		return - 0.5 * (--k * (k - 2) - 1);
	}

	//-----------------------------------------------
	static cubicIn( k ){ return k * k * k; }
	static cubicOut( k ){ return --k * k * k + 1; }
	static cubicInOut( k ){
		if((k *= 2) < 1) return 0.5 * k * k * k;
		return 0.5 * ((k -= 2) * k * k + 2);
	}

	//-----------------------------------------------
	static quartIn( k ){ return k * k * k * k; }
	static quartOut( k ){ return 1 - (--k * k * k * k); }
	static quartInOut( k ){
		if((k *= 2) < 1) return 0.5 * k * k * k * k;
		return - 0.5 * ((k -= 2) * k * k * k - 2);
	}

	//-----------------------------------------------
	static quintIn( k ){ return k * k * k * k * k; }
	static quintOut( k ){ return --k * k * k * k * k + 1; }
	static quintInOut( k ){
		if((k *= 2) < 1) return 0.5 * k * k * k * k * k;
		return 0.5 * ((k -= 2) * k * k * k * k + 2);
	}

	//-----------------------------------------------
	static sineIn( k ){ return 1 - Math.cos(k * Math.PI / 2); }
	static sineOut( k ){ return Math.sin(k * Math.PI / 2); }
	static sineInOut( k ){ return 0.5 * (1 - Math.cos(Math.PI * k)); }

	//-----------------------------------------------
	static expIn( k ){ return k === 0 ? 0 : Math.pow(1024, k - 1); }
	static expOut( k ){ return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k); }
	static expInOut( k ){
		if (k === 0 || k === 1) return k;
		if((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
		return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);
	}

	//-----------------------------------------------
	static circIn( k ){ return 1 - Math.sqrt(1 - k * k); }
	static circOut( k ){ return Math.sqrt(1 - (--k * k)); }
	static circInOut( k ){
		if((k *= 2) < 1) return - 0.5 * (Math.sqrt(1 - k * k) - 1);
		return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
	}

	//-----------------------------------------------
	static elasticIn( k ) {
		if (k === 0 || k === 1) return k;
		return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
	}

	static elasticOut( k ) {
		if (k === 0 || k === 1) return k;
		return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
	}

	static elasticInOut( k ) {
		if (k === 0 || k === 1) return k;

		k *= 2;
		if (k < 1) return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
		return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;
	}

	//-----------------------------------------------
	static backIn( k ){ return k * k * ((1.70158 + 1) * k - 1.70158); }
	static backOut( k ){ return --k * k * ((1.70158 + 1) * k + 1.70158) + 1; }
	static backInOut( k ){
		const s = 1.70158 * 1.525;
		if((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
		return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
	}

	//-----------------------------------------------
	static bounceIn( k ){ return 1 - Easing.bounceOut(1 - k); }
	static bounceOut( k ){
		if(k < (1 / 2.75))			return 7.5625 * k * k;
		else if(k < (2 / 2.75))		return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
		else if(k < (2.5 / 2.75))	return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
		else						return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
	}

	static bounceInOut( k ){
		if(k < 0.5) return Easing.bounceIn(k * 2) * 0.5;
		return Easing.bounceOut(k * 2 - 1) * 0.5 + 0.5;
	}

	//-----------------------------------------------
	// EXTRAS

	static bouncy( t, jump=6, offset=1 ) {
		const rad = 6.283185307179586 * t; //PI_2 * t
		return (offset + Math.sin(rad)) / 2 * Math.sin(jump * rad);
	}

    /** bounce ease out */
    static bounce( t ){
        return ( Math.sin(t * Math.PI * (0.2 + 2.5 * t * t * t)) * Math.pow(1  - t, 2.2) + t) * (1 + (1.2 * (1 - t)));
    }
}
