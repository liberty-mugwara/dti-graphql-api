'use strict';
const fn1 = () => console.log('fn1:', this);
const fn2 = () => {
  console.log('fn2:', this);
  fn1();
};

class A {
  constructor(a) {
    this.a = a;
  }
  shout() {
    console.log('A:', this);
    (() => {
      console.log('fn2:', this);
      fn1();
    })();
    fn2();
  }
}

class B extends A {
  constructor(a, b) {
    super(a);
    this.b = b;
  }
}

const a = new A('Hello!');
const b = new B('OH Nooo!', 'Eish');
a.shout();
