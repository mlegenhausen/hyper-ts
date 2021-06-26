/**
 * @since 0.6.3
 */
import { flow, pipe } from 'fp-ts/function'
import { bind as bind_, chainFirst as chainFirst_, Chain4 } from 'fp-ts/Chain'
import { Task } from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as H from '.'
import * as M from './Middleware'
import { IO } from 'fp-ts/IO'
import { IOEither } from 'fp-ts/IOEither'
import * as E from 'fp-ts/Either'
import { Monad4 } from 'fp-ts/Monad'
import { Alt4 } from 'fp-ts/Alt'
import { Bifunctor4 } from 'fp-ts/Bifunctor'
import { MonadThrow4 } from 'fp-ts/MonadThrow'
import { Functor4, bindTo as bindTo_ } from 'fp-ts/Functor'
import { Apply4, apS as apS_ } from 'fp-ts/Apply'
import { Applicative4 } from 'fp-ts/Applicative'
import * as RTE from 'fp-ts/ReaderTaskEither'
import { Reader } from 'fp-ts/Reader'
import { chainEitherK as chainEitherK_, FromEither4 } from 'fp-ts/FromEither'
import { FromIO4, fromIOK as fromIOK_, chainIOK as chainIOK_, chainFirstIOK as chainFirstIOK_ } from 'fp-ts/FromIO'

/**
 * @category instances
 * @since 0.6.3
 */
export const URI = 'ReaderMiddleware'

/**
 * @category instances
 * @since 0.6.3
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind4<S, R, E, A> {
    readonly [URI]: ReaderMiddleware<S, R, R, E, A>
  }
}

/**
 * @category model
 * @since 0.6.3
 */
export interface ReaderMiddleware<R, I, O, E, A> {
  (r: R): M.Middleware<I, O, E, A>
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function fromTaskEither<R, I = H.StatusOpen, E = never, A = never>(
  fa: TE.TaskEither<E, A>
): ReaderMiddleware<R, I, I, E, A> {
  return () => M.fromTaskEither(fa)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function fromReaderTaskEither<R, I = H.StatusOpen, E = never, A = never>(
  fa: RTE.ReaderTaskEither<R, E, A>
): ReaderMiddleware<R, I, I, E, A> {
  return (r) => M.fromTaskEither(fa(r))
}

/**
 * @category constructors
 * @since 0.6.3
 */
export const fromMiddleware =
  <R, I = H.StatusOpen, O = I, E = never, A = never>(fa: M.Middleware<I, O, E, A>): ReaderMiddleware<R, I, O, E, A> =>
  () =>
    fa

/**
 * @category constructors
 * @since 0.6.3
 */
export function right<R, I = H.StatusOpen, E = never, A = never>(a: A): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.right(a))
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function left<R, I = H.StatusOpen, E = never, A = never>(e: E): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.left(e))
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function rightTask<R, I = H.StatusOpen, E = never, A = never>(fa: Task<A>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.rightTask(fa))
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function leftTask<R, I = H.StatusOpen, E = never, A = never>(te: Task<E>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.leftTask(te))
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function rightIO<R, I = H.StatusOpen, E = never, A = never>(fa: IO<A>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.rightIO(fa))
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function leftIO<R, I = H.StatusOpen, E = never, A = never>(fe: IO<E>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.leftIO(fe))
}

/**
 * @category constructors
 * @since 0.7.0
 */
export const fromEither = <R, I = H.StatusOpen, E = never, A = never>(
  e: E.Either<E, A>
): ReaderMiddleware<R, I, I, E, A> => fromMiddleware(M.fromEither(e))

/**
 * @category constructors
 * @since 0.6.3
 */
export function fromIOEither<R, I = H.StatusOpen, E = never, A = never>(
  fa: IOEither<E, A>
): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.fromIOEither(fa))
}

/**
 * @category constructors
 * @since 0.6.3
 */
export const rightReader =
  <R, I = H.StatusOpen, E = never, A = never>(ma: Reader<R, A>): ReaderMiddleware<R, I, I, E, A> =>
  (r) =>
    M.right(ma(r))

/**
 * @category constructors
 * @since 0.6.3
 */
export function leftReader<R, I = H.StatusOpen, E = never, A = never>(
  me: Reader<R, E>
): ReaderMiddleware<R, I, I, E, A> {
  return (r) => M.left(me(r))
}

/**
 * @category constructors
 * @since 0.6.3
 */
export const ask = <R, I = H.StatusOpen, E = never>(): ReaderMiddleware<R, I, I, E, R> => M.right

/**
 * @category constructors
 * @since 0.6.3
 */
export const asks = <R, E = never, A = never>(f: (r: R) => A): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> =>
  flow(f, M.right)

/**
 * @category combinators
 * @since 0.6.3
 */
export function orElse<R, E, I, O, M, A>(
  f: (e: E) => ReaderMiddleware<R, I, O, M, A>
): (ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, O, M, A> {
  return (ma) => (r) => (c) =>
    pipe(
      ma(r)(c),
      TE.orElse((e) => f(e)(r)(c))
    )
}

/**
 * @category combinators
 * @since 0.6.4
 */
export const orElseW =
  <R2, E, I, O, M, A>(f: (e: E) => ReaderMiddleware<R2, I, O, M, A>) =>
  <R1, B>(ma: ReaderMiddleware<R1, I, O, E, B>): ReaderMiddleware<R2 & R1, I, O, M, A | B> =>
    pipe(ma, orElse<R1 & R2, E, I, O, M, A | B>(f))

/**
 * @category constructors
 * @since 0.6.3
 */
export function status<R, E = never>(status: H.Status): ReaderMiddleware<R, H.StatusOpen, H.HeadersOpen, E, void> {
  return () => M.status(status)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function header<R, E = never>(
  name: string,
  value: string
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void> {
  return () => M.header(name, value)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function contentType<R, E = never>(
  mediaType: H.MediaType
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void> {
  return header('Content-Type', mediaType)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function cookie<R, E = never>(
  name: string,
  value: string,
  options: H.CookieOptions
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void> {
  return () => M.cookie(name, value, options)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function clearCookie<R, E = never>(
  name: string,
  options: H.CookieOptions
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void> {
  return () => M.clearCookie(name, options)
}

const closedHeaders: ReaderMiddleware<any, H.HeadersOpen, H.BodyOpen, never, void> = iof(undefined)

/**
 * @category constructors
 * @since 0.6.3
 */
export function closeHeaders<R, E = never>(): ReaderMiddleware<R, H.HeadersOpen, H.BodyOpen, E, void> {
  return closedHeaders
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function send<R, E = never>(body: string): ReaderMiddleware<R, H.BodyOpen, H.ResponseEnded, E, void> {
  return () => M.send(body)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function end<R, E = never>(): ReaderMiddleware<R, H.BodyOpen, H.ResponseEnded, E, void> {
  return M.end
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function json<R, E>(
  body: unknown,
  onError: (reason: unknown) => E
): ReaderMiddleware<R, H.HeadersOpen, H.ResponseEnded, E, void> {
  return () => M.json(body, onError)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function redirect<R, E = never>(uri: string): ReaderMiddleware<R, H.StatusOpen, H.HeadersOpen, E, void> {
  return () => M.redirect(uri)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function decodeParam<R, E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => M.decodeParam(name, f)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function decodeParams<R, E, A>(
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => M.decodeParams(f)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function decodeQuery<R, E, A>(
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => M.decodeQuery(f)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function decodeBody<R, E, A>(
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => M.decodeBody(f)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function decodeMethod<R, E, A>(
  f: (method: string) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => M.decodeMethod(f)
}

/**
 * @category constructors
 * @since 0.6.3
 */
export function decodeHeader<R, E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => M.decodeHeader(name, f)
}
const _map: Functor4<URI>['map'] = (fa, f) => (r) => pipe(fa(r), M.map(f))

const _apPar: Monad4<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))
const _apSeq: Apply4<URI>['ap'] = (fab, fa) => _chain(fab, (f) => _map(fa, (a) => f(a)))

const _chain: Monad4<URI>['chain'] = (ma, f) => (r) =>
  pipe(
    ma(r),
    M.chain((a) => f(a)(r))
  )

const _alt: Alt4<URI>['alt'] = (fx, f) => (r) => (c) =>
  pipe(
    fx(r)(c),
    TE.alt(() => f()(r)(c))
  )

const _bimap: Bifunctor4<URI>['bimap'] = (fea, f, g) => (r) => (c) =>
  pipe(
    fea(r)(c),
    TE.bimap(f, ([a, c]) => [g(a), c])
  )

const _mapLeft: Bifunctor4<URI>['mapLeft'] = (fea, f) => (r) => (c) => pipe(fea(r)(c), TE.mapLeft(f))

/**
 * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
 * use the type constructor `F` to represent some computational context.
 *
 * @category Functor
 * @since 0.6.3
 */
export const map =
  <A, B>(f: (a: A) => B) =>
  <R, I, E>(fa: ReaderMiddleware<R, I, I, E, A>): ReaderMiddleware<R, I, I, E, B> =>
    _map(fa, f)

/**
 * Map a pair of functions over the two last type arguments of the bifunctor.
 *
 * @category Bifunctor
 * @since 0.6.3
 */
export const bimap =
  <E, G, A, B>(f: (e: E) => G, g: (a: A) => B) =>
  <R, I>(fa: ReaderMiddleware<R, I, I, E, A>): ReaderMiddleware<R, I, I, G, B> =>
    _bimap(fa, f, g)

/**
 * Map a function over the second type argument of a bifunctor.
 *
 * @category Bifunctor
 * @since 0.6.3
 */
export const mapLeft =
  <E, G>(f: (e: E) => G) =>
  <R, I, A>(fa: ReaderMiddleware<R, I, I, E, A>): ReaderMiddleware<R, I, I, G, A> =>
    _mapLeft(fa, f)

/**
 * Apply a function to an argument under a type constructor.
 *
 * @category Apply
 * @since 0.6.3
 */
export const ap =
  <R, I, E, A>(fa: ReaderMiddleware<R, I, I, E, A>) =>
  <B>(fab: ReaderMiddleware<R, I, I, E, (a: A) => B>): ReaderMiddleware<R, I, I, E, B> =>
  (r) =>
    pipe(fab(r), M.ap(fa(r)))

/**
 * Less strict version of [`ap`](#ap).
 *
 * @category Apply
 * @since 0.6.3
 */
export const apW: <R2, I, E2, A>(
  fa: ReaderMiddleware<R2, I, I, E2, A>
) => <R1, E1, B>(fab: ReaderMiddleware<R1, I, I, E1, (a: A) => B>) => ReaderMiddleware<R1 & R2, I, I, E1 | E2, B> =
  ap as any

/**
 * @category Pointed
 * @since 0.6.3
 */
export const of: <R, I = H.StatusOpen, E = never, A = never>(a: A) => ReaderMiddleware<R, I, I, E, A> = right

/**
 * @category Pointed
 * @since 0.6.3
 */
export function iof<R, I = H.StatusOpen, O = H.StatusOpen, E = never, A = never>(
  a: A
): ReaderMiddleware<R, I, O, E, A> {
  return () => M.iof(a)
}

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation.
 *
 * @category Monad
 * @since 0.6.3
 */
export const chain =
  <R, I, E, A, B>(f: (a: A) => ReaderMiddleware<R, I, I, E, B>) =>
  (ma: ReaderMiddleware<R, I, I, E, A>): ReaderMiddleware<R, I, I, E, B> =>
    _chain(ma, f)

/**
 * Less strict version of [`chain`](#chain).
 *
 * @category Monad
 * @since 0.6.3
 */
export const chainW: <R2, I, E2, A, B>(
  f: (a: A) => ReaderMiddleware<R2, I, I, E2, B>
) => <R1, E1>(ma: ReaderMiddleware<R1, I, I, E1, A>) => ReaderMiddleware<R1 & R2, I, I, E1 | E2, B> = chain as any

/**
 * @category Monad
 * @since 0.6.3
 */
export const ichain: <R, A, O, Z, E, B>(
  f: (a: A) => ReaderMiddleware<R, O, Z, E, B>
) => <I>(ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, Z, E, B> = ichainW

/**
 * @category Monad
 * @since 0.6.3
 */
export function ichainW<R2, A, O, Z, E2, B>(
  f: (a: A) => ReaderMiddleware<R2, O, Z, E2, B>
): <R1, I, E1>(ma: ReaderMiddleware<R1, I, O, E1, A>) => ReaderMiddleware<R1 & R2, I, Z, E1 | E2, B> {
  return (ma) => (r) => (ci) =>
    pipe(
      ma(r)(ci),
      TE.chainW(([a, co]) => f(a)(r)(co))
    )
}

/**
 * @category combinators
 * @since 0.6.3
 */
export const chainMiddlewareK =
  <R, I, E, A, B>(f: (a: A) => M.Middleware<I, I, E, B>) =>
  (ma: ReaderMiddleware<R, I, I, E, A>): ReaderMiddleware<R, I, I, E, B> =>
    pipe(
      ma,
      chain((a) => fromMiddleware(f(a)))
    )

/**
 * @category combinators
 * @since 0.6.3
 */
export const ichainMiddlewareK: <R, A, O, Z, E, B>(
  f: (a: A) => M.Middleware<O, Z, E, B>
) => <I>(ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, Z, E, B> = chainMiddlewareK as any

/**
 * @category combinators
 * @since 0.6.5
 */
export const ichainMiddlewareKW: <R, A, O, Z, E, B>(
  f: (a: A) => M.Middleware<O, Z, E, B>
) => <I, D>(ma: ReaderMiddleware<R, I, O, D, A>) => ReaderMiddleware<R, I, Z, D | E, B> = chainMiddlewareK as any

/**
 * @category combinators
 * @since 0.6.3
 */
export const chainTaskEitherK: <E, A, B>(
  f: (a: A) => TE.TaskEither<E, B>
) => <R, I>(ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B> = (f) => (ma) => (r) =>
  pipe(
    ma(r),
    M.chain((a) => M.fromTaskEither(f(a)))
  )

/**
 * @category combinators
 * @since 0.6.3
 */
export const chainTaskEitherKW: <E2, A, B>(
  f: (a: A) => TE.TaskEither<E2, B>
) => <R, I, E1>(ma: ReaderMiddleware<R, I, I, E1, A>) => ReaderMiddleware<R, I, I, E1 | E2, B> = chainTaskEitherK as any

/**
 * @category combinators
 * @since 0.6.3
 */
export const chainReaderTaskEitherK: <R, E, A, B>(
  f: (a: A) => RTE.ReaderTaskEither<R, E, B>
) => <I>(ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B> = (f) => (ma) => (r) =>
  pipe(
    ma(r),
    M.chain((a) => M.fromTaskEither(f(a)(r)))
  )

/**
 * @category combinators
 * @since 0.6.3
 */
export const chainReaderTaskEitherKW: <R2, E2, A, B>(
  f: (a: A) => RTE.ReaderTaskEither<R2, E2, B>
) => <R1, I, E1>(ma: ReaderMiddleware<R1, I, I, E1, A>) => ReaderMiddleware<R1 & R2, I, I, E1 | E2, B> =
  chainReaderTaskEitherK as any

/**
 * @category instances
 * @since 0.6.3
 */
export const Functor: Functor4<URI> = {
  URI,
  map: _map,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const ApplyPar: Apply4<URI> = {
  ...Functor,
  ap: _apPar,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const ApplySeq: Apply4<URI> = {
  ...Functor,
  ap: _apSeq,
}

/**
 * Use [`ApplySeq`](./ReaderMiddleware.ts.html#ApplySeq) instead.
 *
 * @category instances
 * @since 0.6.3
 * @deprecated
 */
export const Apply: Apply4<URI> = ApplySeq

/**
 * @category instances
 * @since 0.7.0
 */
export const ApplicativePar: Applicative4<URI> = {
  ...ApplyPar,
  of,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const ApplicativeSeq: Applicative4<URI> = {
  ...ApplySeq,
  of,
}

/**
 * Use [`ApplicativeSeq`](./ReaderMiddleware.ts.html#ApplicativeSeq) instead.
 *
 * @category instances
 * @since 0.6.3
 * @deprecated
 */
export const Applicative: Applicative4<URI> = ApplicativeSeq

/**
 * @category instances
 * @since 0.7.0
 */
export const Chain: Chain4<URI> = {
  ...ApplyPar,
  chain: _chain,
}

/**
 * @category instances
 * @since 0.6.3
 */
export const Monad: Monad4<URI> = {
  ...ApplicativeSeq,
  chain: _chain,
}

/**
 * @category instances
 * @since 0.6.3
 */
export const MonadThrow: MonadThrow4<URI> = {
  ...Monad,
  throwError: left,
}

/**
 * @category instances
 * @since 0.6.3
 */
export const Alt: Alt4<URI> = {
  ...Functor,
  alt: _alt,
}

/**
 * @category instances
 * @since 0.6.3
 */
export const Bifunctor: Bifunctor4<URI> = {
  URI,
  bimap: _bimap,
  mapLeft: _mapLeft,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const FromEither: FromEither4<URI> = {
  URI,
  fromEither,
}

/**
 * Composes computations in sequence, using the return value of one computation to determine
 * the next computation and keeping only the result of the first.
 *
 * Derivable from `Chain`.
 *
 * @category combinators
 * @since 0.7.0
 */
export const chainFirst: <R, I, E, A, B>(
  f: (a: A) => ReaderMiddleware<R, I, I, E, B>
) => (ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, A> = chainFirst_(Chain)

/**
 * Less strict version of [`chainFirst`](#chainfirst).
 *
 * Derivable from `Chain`.
 *
 * @category combinators
 * @since 0.7.0
 */
export const chainFirstW: <R2, I, E2, A, B>(
  f: (a: A) => ReaderMiddleware<R2, I, I, E2, B>
) => <R1, E1>(ma: ReaderMiddleware<R1, I, I, E1, A>) => ReaderMiddleware<R1 & R2, I, I, E1 | E2, A> = chainFirst as any

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainEitherK: <E, A, B>(
  f: (a: A) => E.Either<E, B>
) => <R, I>(ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B> = chainEitherK_(FromEither, Chain)

/**
 * Less strict version of [`chainEitherK`](#chaineitherk).
 *
 * @category combinators
 * @since 0.7.0
 */
export const chainEitherKW: <E2, A, B>(
  f: (a: A) => E.Either<E2, B>
) => <R, I, E1>(ma: ReaderMiddleware<R, I, I, E1, A>) => ReaderMiddleware<R, I, I, E1 | E2, B> = chainEitherK as any

/**
 * @category constructors
 * @since 0.7.0
 */
export const fromIO: FromIO4<URI>['fromIO'] = rightIO

/**
 * @category instances
 * @since 0.7.0
 */
export const FromIO: FromIO4<URI> = {
  URI,
  fromIO,
}

/**
 * @category combinators
 * @since 0.7.0
 */
export const fromIOK = fromIOK_(FromIO)

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainIOK = chainIOK_(FromIO, Chain)

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainFirstIOK = chainFirstIOK_(FromIO, Chain)

/**
 * @since 0.6.3
 */
export const Do = iof<unknown, unknown, unknown, never, {}>({})

/**
 * @since 0.6.3
 */
export const bindTo = bindTo_(Functor)

/**
 * @since 0.6.3
 */
export const bind = bind_(Chain)

/**
 * @since 0.6.3
 */
export const bindW: <N extends string, R, I, A, E2, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderMiddleware<R, I, I, E2, B>
) => <E1>(
  fa: ReaderMiddleware<R, I, I, E1, A>
) => ReaderMiddleware<R, I, I, E1 | E2, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = bind as any

/**
 * @since 0.7.0
 */
export const apS = apS_(ApplyPar)

/**
 * @since 0.7.0
 */
export const apSW: <A, N extends string, I, R2, E2, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderMiddleware<R2, I, I, E2, B>
) => <R1, E1>(
  fa: ReaderMiddleware<R1, I, I, E1, A>
) => ReaderMiddleware<R1 & R2, I, I, E1 | E2, { readonly [K in keyof A | N]: K extends keyof A ? A[K] : B }> =
  apS as any
