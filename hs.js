/**
 * HS - Haskell functions for Javascript (with Currying)
 * Copyright (c) 2008 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Licensed under BSD (http://www.opensource.org/licenses/bsd-license.php)
 * Date: 11/17/2008
 *
 * @author Ariel Flesler
 * @version 1.0.0
 */
 
(function(){
  
  function curry( fn ){
    return function(){
      var args = arguments;
      return args.length >= fn.length ? fn.apply( this, args ) : _curry( this, args );
    };
  };

  function _curry( scope, args ){
    var master = args.callee;    
    args = copy(args);

    return function(){
      return master.apply( scope, args.concat(copy(arguments)) );
    };
  };


  var hs = this.hs = function() {
    var fn = hs[[].shift.call(arguments)];
    return fn.apply( this, arguments );
  };
  
  function _(){ 
    arguments[0] = hs[arguments[0]];
    return hs.flip.apply(hs,arguments);
  };
  
  function array( obj ){
    return obj && ( obj.callee || obj.constructor == Array );
  };
  function string( obj ){
    return typeof obj == 'string';
  };
  
  function makeString( arr ){
    return !array(arr) || arr.length && !string(arr[0]) ? arr : arr.join('');
  };
  function makeArray( obj ){
    return array(obj) ? copy(obj) : hs.values(obj);
  };  
  function each( list, f ){
    if( array(list) ){
      for( var i=0, l=list.length; i < l; i++ )
        f( list[i], i );  
    }else{
      for( var key in list )
        f( list[key], key );
    }
  };
  function id( x ){
    return x;
  };
  
  function empty(obj){
    return array(obj) ? [] : {};
  };
  function copy(obj){
    return array(obj) ? [].slice.call(obj) : hs.map( id, obj );
  };
  eq = curry(function(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  });

  
  each({
    each: function( f, list ){
      each( list, f );
    },
    map:function( f, list ){      
      var copy = empty(list);
        
      each( list, function( v, k ){
        copy[k] = f( v, k );
      });
      
      return copy;
    },
    filter:function( f, list ){
      var arr = array(list),  
        copy = empty(list);
        
      each( list, function( v, k ){
        if( f(v, k) )
          copy[ arr ? copy.length : k ] = v;
      });
      
      return copy;
    },
    take:function( quant, list ){
      return makeArray(list).slice(0,quant);
    },
    drop:function( quant, list ){
      return makeArray(list).slice(quant);
    },
    takeWhile:function( f, list ){
      var i = 0;
      while( i < list.length && f(list[i],i) )
        i++;
      return hs.take( i, list );
    },
    dropWhile:function( f, list ){
      var i = 0;
      while( i < list.length && f(list[i],i) )
        i++;
      return hs.drop( i, list );
    },
    elem:function( obj, list ){
      return any(eq(obj), list);
    },
    join:function( chr, list ){
      return makeArray(list).join(chr);
    },
    foldl1:function( f, list ){
      // maps will lose their keys
      return hs.foldl( f, hs.head(list), hs.tail(list) );
    },
    foldr1:function( f, list ){
      return hs.foldl1( f, hs.reverse(list) );
    },
    // TODO: should add ordered
    insert:function( obj, list ){
      list = makeArray(list);
      list.push(obj);
      return list;
    },
    // TODO: cycle
  }, function( fn, name ){
    hs[name] = curry(function( a, list ){
      if( string(list) ){
        var str = true;
        list = list.split('');
      }
      list = fn( a, list );
      
      return str ? makeString(list) : list;
    });
  });
  function clone(a) {
    return JSON.parse(JSON.stringify(a));
  }
  replicate = curry(function(n, a) {
    var ret = [];
    for (var i = 0; i < n; i++) {
      ret[i] = a;
    }
    return ret;
  });
  replicateObj = curry(function(n, a) {
    var ret = [];
    for (var i = 0; i < n; i++) {
      ret[i] = clone(a);
    }
    return ret;
  });
  
  each({
    foldl:function( f, accum, list ){
      each( list, function( v, k ){
        accum = f( accum, v, k );
      });
      return accum;
    },
    foldr:function( f, accum, list ){
      // Only works for arrays, not maps
      return hs.foldl( f, accum, hs.reverse(list) );
    },
    // Haskell's scan includes the accumulator as first element
    // I might change that later
    scanl:function( f, accum, list ){
      return hs.map(function( v, k ){
        return accum = f( accum, v, k );
      }, list );
    },
    scanr:function( f, accum, list ){
      // Only works for arrays, not maps
      return hs.scanl( f, accum, hs.reverse(list) );
    }
  }, function( fn, name ){
    hs[name] = curry(function( a, b, list ){
      if(  string(list) ){
        var str = true;
        list = list.split('');
      }
      list = fn( a, b, list );
      
      return str ? makeString(list) : list;
    });
  });
  
  // isXXX
  each({
    Alpha:/[a-z]/i,
    AlphaNum:/[a-z0-9]/i,
    Digit:/[0-9]/,
    HexDigit:/[a-f0-9]/i,
    Lower:/[a-z]/,
    OctDigit:/[0-7]/,
    Space:/\s?/,
    Upper:/[A-Z]/,
    Vowel:/[aeiou]/i
  }, function( re, name ){
    hs['is'+name] = function(chr){
      return re.test(chr);
    };
  });


  each({
    head:function( list ){
      if( array(list) )
        return list[0];
      for( var k in list )
        return list[k];
    },
    last:function( list ){
      if( array(list) )
        return list[ list.length-1 ];
      var v;
      for( var k in list )
        v = list[k];
      return v;
    },
    // will lose keys for maps
    reverse:function( list ){      
      return makeArray(list).reverse();
    }
  }, function( fn, name ){
    hs[name] = function(list){
      if( string(list) ){
        var str = true;
        list = list.split('');
      }
      list = fn(list );
      
      return str ? makeString(list) : list;
    };
  });
  
  // Regular funtions
  each({
    id:id,
    curry: curry,
    '.':function( f, g, x ){
      return f( g.apply(this,hs.drop(2,arguments)) );
    },
    'const':function( x, y ){
      return x;
    },
    even:function( num ){
      return num % 0 == 0;
    },
    flip:function( f, x, y ){
      return f( y, x );
    },
    not:function( x ){
      return !x;
    },
    otherwise:function(){
      return true;
    },
    show:function( x ){
      return '' + x;
    },
    split:function( chr, str ){
      return str.split(chr);
    },
    splitAt:function( i, list ){
      return [ hs.take(i,list), hs.drop(i+1,list) ];
    },
    enumFromTo:function( start, end ){
      if( start > end )
        return hs.reverse( hs.enumFromTo(end,start) );
      if( string(start) )
        return map( chr, hs.enumFromTo( hs.ord(start), hs.ord(end) ) ).join('');
      return hs.map(function(v,i){
        return i + start;
      }, Array(end-start+1));
    },
    // arr1 becomes the keys and arr2, the values
    zip:function( arr1, arr2 ){
      var data = {};
      each( arr1, function( v, k ){
        data[ v ] = arr2[k];
      });
      return data;
    },
    // Hm.. useless ?
    unzip:function( data ){
      return [ hs.keys(data), hs.values(data) ];
    },
    zipWith:function( f, list1, list2 ){
      return hs.map(function( v, k ){
        return f( v, list2[k], k );
      }, list1 );
    },
    concat:function( list ){
      var arr = [];
      return arr.concat.apply( arr, makeArray(list) );
    },
    chr:function(code){
      return String.fromCharCode(code);
    },
    ord:function(chr){
      return chr.charCodeAt(0);
    },
    intToDigit:function( num ){
      return num.toString(16);
    },
    toUpper:function( chr ){
      return chr.toUpperCase();
    },
    toLower:function( chr ){
      return chr.toLowerCase();
    },
    max:function( a, b ){
      return a > b ? a : b;
    },
    min:function( a, b ){
      return a < b ? a : b;
    },
    // TODO: Change them, they're useless like this
    fst:function( obj ){
      // key/value instead of (x,y)
      for( var key in obj )
        return key;
      return null;
    },
    snd:function( obj ){
      // key/value instead of (x,y)
      for( var key in obj )
        return obj[key];
      return null;
    }
  }, function( fn, name ){
    hs[name] = /*fn.length < 2 ? fn :*/ curry(fn);
  });
  
  // Operators
  var fixOp = { '!=':'/=' };
  each('+,-,/,*,%,^,<,<=,==,!=,>,>=,<<,>>,&,&&,|,||'.split(','), function( op ){
    hs[ fixOp[op] || op ] = curry(Function('x','y','return (x)'+op+'(y);'));
  });
  
  // From Math
  // Math.max and Math.min don't work on strings
  each('sin,asin,cos,acos,floor,ceil,round,tan,atan,atan2,sqrt,pow,log'.split(','), function( name ){
    hs[name] = curry(Math[name]);
  });
  
  hs.pi = Math.PI;
  
  // Composed
  each({
    read: eval, // ok, this one isn't composed
    _: _,
    sum: hs.foldl( hs['+'], 0 ),
    product: hs.foldl( hs['*'], 1 ),
    even: hs('.', hs('==',0), _("%", 2 )),    
    and: hs.foldl( hs['&&'], true ),
    or: hs.foldl( hs['||'], false ),
    tail: hs.drop(1),
    init: hs.take(-1),
    lines: hs.split('\n'),
    words: hs.split(' '),
    unlines: hs.join('\n'),
    unwords: hs.join(' '),
    // Can't use length, not defined yet
    'null': hs.foldl( hs('const',false), true ),
    add: hs['+'],
    inc: hs('+',1),
    dec: hs('-',1),
    prod: hs['*'],
    negate: hs('*',-1),
    recip: hs('/',1),
    rem: hs['%'],
    compose: hs['.'],
    notElem: hs('.',hs.not,hs.elem),
    div: hs('.', hs.floor, hs['/']),
    mod: hs['%'],
    digitToInt: hs.flip( parseInt, 16 ),
    concatMap: hs('.', hs.concat, hs.map),
    maximum: hs.foldl1( hs.max ),
    minimum: hs.foldl1( hs.min ),
    // Haskell's repeat generates infinite lists
    // We can't have that here (at least for now)
    repeat: hs.replicate,
    '**': hs.pow,
    ':': hs.insert,
    // Don't work, they map to an object
    // FIXME
    keys: hs.map( hs.flip(id) ),
    values: hs.map( id )
  }, function( fn, name ){
    hs[name] = fn;
  });

  // Composed of composed
  each({
    odd: hs('.', hs.not, hs.even ),
    all: hs('.',hs.and,hs.map),
    any: hs('.',hs.or,hs.map),
    "length'": hs.foldl( hs.inc, 0 )
  }, function( fn, name ){
    hs[name] = fn;
  });
  
  // bring them all to the global namespace
  hs.global = function(){
    for( var name in hs )
      window[name] = hs[name];
  };
})();
