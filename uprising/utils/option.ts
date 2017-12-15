import { Result, Ok, Err } from './result';

export interface Option<T> {
  map <U>(fn: (a: T) => U): Option<U>;
  isSome(): boolean;
  isNone(): boolean;
  isSomeAnd(fn: (a: T) => boolean): boolean;
  isNoneAnd(fn: () => boolean): boolean;
  unwrap(): T;
  unwrapOr(def: T): T;
  unwrapOrElse(f: () => T): T;
  map<U>(f: (a: T) => U): Option<U>;
  mapOr<U>(def: U, f: (a: T) => U): U;
  mapOrElse<U>(def: () => U, f: (a: T) => U): U;
  okOr<E>(err: E): Result<T, E>;
  okOrElse<E>(err: () => E): Result<T, E>;
  and<U>(optb: Option<U>): Option<U>;
  andThen<U>(f: (a: T) => Option<U>): Option<U>;
  or(optb: Option<T>): Option<T>;
  orElse(f: () => Option<T>): Option<T>;
}

export class Some<T> implements Option<T> {
  private value: T;

  constructor(v: T) {
    this.value = v;
  }

  static wrapNull<T>(value: T): Option<T> {
    if (value == null) {
      return new None<T>();
    } else {
      return new Some<T>(value);
    }
  }

  map <U>(fn: (a: T) => U): Option<U> {
    return new Some(fn(this.value))
  }

  isSome(): boolean {
    return true;
  }

  isNone(): boolean {
    return false;
  }

  isSomeAnd(fn: (a: T) => boolean): boolean {
    return fn(this.value)
  }

  isNoneAnd(_fn: () => boolean): boolean {
    return false
  }

  unwrap(): T {
    return this.value
  }

  unwrapOr(_def: T): T {
    return this.value;
  }

  unwrapOrElse(_f: () => T): T {
    return this.value;
  }

  mapOr<U>(_def: U, f: (a: T) => U): U {
    return f(this.value)
  }

  mapOrElse<U>(_def: () => U, f: (a: T) => U): U {
    return f(this.value)
  }

  okOr<E>(_err: E): Result<T, E> {
    return new Ok<T, E>(this.value)
  }

  okOrElse<E>(_err: () => E): Result<T, E> {
    return new Ok<T, E>(this.value)
  }

  and<U>(optb: Option<U>): Option<U> {
    return optb;
  }

  andThen<U>(f: (a: T) => Option<U>): Option<U> {
    return f(this.value);
  }

  or(_optb: Option<T>): Option<T> {
    return this;
  }

  orElse(_f: () => Option<T>): Option<T> {
    return this;
  }

  toString(): string {
    return "Some " + this.value;
  }
}

export class None<T> implements Option<T> {

  constructor() {
  }

  map <U>(_fn: (a: T) => U): Option<U> {
    return <Option<U>>None._instance;
  }

  isSome(): boolean {
    return false;
  }

  isNone(): boolean {
    return true;
  }

  isSomeAnd(_fn: (a: T) => boolean): boolean {
    return false
  }

  isNoneAnd(fn: () => boolean): boolean {
    return fn()
  }

  unwrap(): T {
    console.error("None.unwrap()");
    throw "None.get";
    // return null;
  }

  unwrapOr(def: T): T {
    return def;
  }

  unwrapOrElse(f: () => T): T {
    return f()
  }

  mapOr<U>(def: U, _f: (a: T) => U): U {
    return def;
  }

  mapOrElse<U>(def: () => U, _f: (a: T) => U): U {
    return def();
  }

  okOr<E>(err: E): Result<T, E> {
    return new Err<T, E>(err)
  }

  okOrElse<E>(err: () => E): Result<T, E> {
    return new Err<T, E>(err())
  }

  and<U>(_optb: Option<U>): Option<U> {
    return None.instance<U>();
  }

  andThen<U>(_f: (a: T) => Option<U>): Option<U> {
    return None.instance<U>();
  }

  or(optb: Option<T>): Option<T> {
    return optb;
  }

  orElse(f: () => Option<T>): Option<T> {
    return f();
  }

  private static _instance: Option<any> = new None();

  public static instance<X>(): Option<X> {
    return <Option<X>> None._instance;
  }

  public toString(): string {
    return "None";
  }
}
