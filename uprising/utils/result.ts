import { Option, Some, None } from './option';

export interface Result<T, E> {
  map<U>(fn: (a: T) => U): Result<U, E>;
  mapErr<U>(fn: (a: E) => U): Result<T, U>;
  isOk(): boolean;
  isErr(): boolean;
  ok(): Option<T>;
  err(): Option<E>;
  and<U>(res: Result<U,E>): Result<U,E>;
  andThen<U>(op: (a: T) => Result<U,E>): Result<U,E>;
  or(res: Result<T,E>): Result<T,E>;
  orElse<U>(op: (a: E) => Result<T,U>): Result<T,U>;
  unwrap(): T;
  unwrapOr(optb: T): T;
  unwrapOrElse(op: (a: E) => T): T
}

export class Ok<T, E> implements Result<T, E> {
  private value: T;

  constructor(v: T) {
    this.value = v;
  }

  map <U>(fn: (a: T) => U): Result<U, E> {
    return new Ok<U, E>(fn(this.value))
  }

  mapErr <U>(_fn: (a: E) => U): Result<T, U> {
    return new Ok<T, U>(this.value);
  }

  isOk(): boolean {
    return true;
  }

  isErr(): boolean {
    return false;
  }

  ok(): Option<T> {
    return new Some(this.value);
  }

  err(): Option<E> {
    return None.instance<E>();
  }

  and<U>(res: Result<U,E>): Result<U,E> {
    return res;
  }

  andThen<U>(op: (a: T) => Result<U,E>): Result<U,E> {
    return op(this.value);
  }

  or(_res: Result<T,E>): Result<T,E> {
    return this;
  }

  orElse<U>(_op: (a: E) => Result<T,U>): Result<T,U> {
    return new Ok<T,U>(this.value);
  }

  unwrapOr(_optb: T): T {
    return this.value;
  }

  unwrapOrElse(_op: (e: E) => T): T {
    return this.value;
  }

  unwrap(): T {
    return this.value
  }

  toString(): string {
    return "OK: " + this.value;
  }
}

export class Err<T, E> implements Result<T, E> {
  private error: E;

  constructor(error: E) {
    this.error = error;
  }

  map <U>(_fn: (a: T) => U): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  mapErr <U>(fn: (a: E) => U): Result<T, U> {
    return new Err<T,U>(fn(this.error));
  }

  isOk(): boolean {
    return false;
  }

  isErr(): boolean {
    return false;
  }

  ok(): Option<T> {
    return None.instance<T>();
  }

  err(): Option<E> {
    return new Some(this.error);
  }

  and<U>(_res: Result<U,E>): Result<U,E> {
    return new Err<U,E>(this.error);
  }

  andThen<U>(_op: (e: T) => Result<U,E>): Result<U,E> {
    return new Err<U,E>(this.error);
  }

  or(res: Result<T,E>): Result<T,E> {
    return res;
  }

  orElse<U>(op: (a: E) => Result<T,U>): Result<T,U> {
    return op(this.error);
  }

  unwrapOr(optb: T): T {
    return optb;
  }

  unwrapOrElse(op: (e: E) => T): T {
    return op(this.error);
  }

  unwrap(): T {
    throw "Err.get"
  }

  public toString(): string {
    return "ERROR: " + this.error;
  }
}
