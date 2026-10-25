-- Haskell samples shown on FP Shapes, for base 4.22.0.0 (GHC 9.14), mtl 2.3.2,
-- either 5.0.3 and semigroupoids 6.0.1. Code between "-- <sample KEY>" and
-- "-- </sample>" is shown on the site verbatim. Each sample binds `result`,
-- which the `verify` after it compares with the expected value.
-- Run: `npm run samples:haskell`. It exits non-zero if any check fails.
module Main (main) where

import Control.Applicative (empty, liftA2, (<|>))
import Control.Exception (SomeException, evaluate, try)
import Control.Monad (join, mfilter)
import Control.Monad.Except (throwError)
import Data.Bifunctor (bimap, first)
import Data.Either.Validation (Validation (..))
import Data.Functor.Alt ((<!>))
import Data.IORef (modifyIORef', newIORef, readIORef)
import Data.List (partition)
import Data.Maybe (fromMaybe, mapMaybe, maybeToList)
import Debug.Trace (traceShowId)
import System.Exit (exitFailure)

main :: IO ()
main = do
  failures <- newIORef (0 :: Int)
  let verify :: (Eq a, Show a) => String -> a -> a -> IO ()
      verify key expected got
        | expected == got = putStrLn ("PASS " ++ key ++ ": " ++ show got)
        | otherwise = do
            putStrLn ("FAIL " ++ key ++ ": expected " ++ show expected ++ ", got " ++ show got)
            modifyIORef' failures (+ 1)

  -- --- Constructors -----------------------------------------------------------

  -- <sample pure:either>
  let result = pure 2 :: Either String Int
  -- </sample>
  verify "pure:either" (Right 2) result

  -- <sample pure:option>
  let result = pure 2 :: Maybe Int
  -- </sample>
  verify "pure:option" (Just 2) result

  -- <sample pure:validation>
  let result = pure 2 :: Validation [String] Int
  -- </sample>
  verify "pure:validation" (Success 2) result

  -- <sample pure:list>
  let result = pure 2 :: [Int]
  -- </sample>
  verify "pure:list" [2] result

  -- <sample fail:either>
  let result = throwError "oops" :: Either String Int
  -- </sample>
  verify "fail:either" (Left "oops") result

  -- <sample fail:option>
  let result = throwError () :: Maybe Int
  -- </sample>
  verify "fail:option" Nothing result

  -- <sample fail:validation>
  let result = Failure ["oops"] :: Validation [String] Int
  -- </sample>
  verify "fail:validation" (Failure ["oops"]) result

  -- <sample fail:list>
  let result = empty :: [Int]
  -- </sample>
  verify "fail:list" [] result

  -- <sample fromNullable:either>
  let ages = [("ada", 36)] :: [(String, Int)]
      result = maybe (Left "missing") Right (lookup "bob" ages)
  -- </sample>
  verify "fromNullable:either" (Left "missing") result

  -- <sample fromNullable:validation>
  let ages = [("ada", 36)] :: [(String, Int)]
      result = maybe (Failure ["missing"]) Success (lookup "bob" ages)
  -- </sample>
  verify "fromNullable:validation" (Failure ["missing"] :: Validation [String] Int) result

  -- <sample fromNullable:list>
  let ages = [("ada", 36)] :: [(String, Int)]
      result = maybeToList (lookup "bob" ages)
  -- </sample>
  verify "fromNullable:list" [] result

  -- <sample fromPredicate:either>
  let atLeast6 x = if x > 5 then Right x else Left ("too small: " ++ show x)
      result = atLeast6 (3 :: Int)
  -- </sample>
  verify "fromPredicate:either" (Left "too small: 3") result

  -- <sample fromPredicate:option>
  let result = mfilter (> 5) (Just (3 :: Int))
  -- </sample>
  verify "fromPredicate:option" Nothing result

  -- <sample fromPredicate:validation>
  let atLeast5 x = if x >= 5 then Success x else Failure ["too small: " ++ show x]
      result = atLeast5 (3 :: Int)
  -- </sample>
  verify "fromPredicate:validation" (Failure ["too small: 3"]) result

  -- <sample fromPredicate:list>
  let result = filter (>= 5) [3 :: Int]
  -- </sample>
  verify "fromPredicate:list" [] result

  -- <sample tryCatch:either>
  attempt <- try (evaluate (read "x" :: Int)) :: IO (Either SomeException Int)
  let result = first (const "invalid input") attempt
  -- </sample>
  verify "tryCatch:either" (Left "invalid input") result

  -- <sample tryCatch:option>
  attempt <- try (evaluate (read "x" :: Int)) :: IO (Either SomeException Int)
  let result = either (const Nothing) Just attempt
  -- </sample>
  verify "tryCatch:option" Nothing result

  -- <sample tryCatch:validation>
  attempt <- try (evaluate (read "x" :: Int)) :: IO (Either SomeException Int)
  let result = either (const (Failure ["invalid input"])) Success attempt
  -- </sample>
  verify "tryCatch:validation" (Failure ["invalid input"] :: Validation [String] Int) result

  -- --- Mapping ----------------------------------------------------------------

  -- <sample map:either>
  let result = fmap (* 10) (Right 2 :: Either String Int)
  -- </sample>
  verify "map:either" (Right 20) result

  -- <sample map:option>
  let result = fmap (* 10) (Just (2 :: Int))
  -- </sample>
  verify "map:option" (Just 20) result

  -- <sample map:list>
  let result = map (* 10) [1, 2, 3 :: Int]
  -- </sample>
  verify "map:list" [10, 20, 30] result

  -- <sample bimap:either>
  let result = bimap length (* 10) (Left "oops" :: Either String Int)
  -- </sample>
  verify "bimap:either" (Left 4) result

  -- <sample bimap:tuple>
  let result = bimap length (* 10) ("oops", 2 :: Int)
  -- </sample>
  verify "bimap:tuple" (4, 20) result

  -- --- Sequencing -------------------------------------------------------------

  -- <sample flatMap:either>
  let half x = if even x then Right (x `div` 2) else Left "odd"
      result = Right 4 >>= half :: Either String Int
  -- </sample>
  verify "flatMap:either" (Right 2) result

  -- <sample flatMap:option>
  let half x = if even x then Just (x `div` 2) else Nothing
      result = Just (4 :: Int) >>= half
  -- </sample>
  verify "flatMap:option" (Just 2) result

  -- <sample flatMap:list>
  let result = [1, 2, 3 :: Int] >>= \x -> [x, x]
  -- </sample>
  verify "flatMap:list" [1, 1, 2, 2, 3, 3] result

  -- <sample flatten:either>
  let result = join (Right (Right 1) :: Either String (Either String Int))
  -- </sample>
  verify "flatten:either" (Right 1) result

  -- <sample flatten:option>
  let result = join (Just (Just (1 :: Int)))
  -- </sample>
  verify "flatten:option" (Just 1) result

  -- <sample flatten:list>
  let result = join [[1, 2], [3 :: Int]]
  -- </sample>
  verify "flatten:list" [1, 2, 3] result

  -- <sample tap:either>
  let audit x = if x > 0 then Right () else Left "audit failed"
      result = Right 2 >>= \x -> x <$ audit x :: Either String Int
  -- </sample>
  verify "tap:either" (Right 2) result

  -- <sample tap:option>
  let step _ = Nothing :: Maybe ()
      result = Just (2 :: Int) >>= \x -> x <$ step x
  -- </sample>
  verify "tap:option" Nothing result

  -- <sample peek:either>
  let result = fmap traceShowId (Right 2 :: Either String Int)
  -- </sample>
  verify "peek:either" (Right 2) result

  -- <sample peek:list>
  let result = map traceShowId [1, 2, 3 :: Int]
  -- </sample>
  verify "peek:list" [1, 2, 3] result

  -- --- Zipping ----------------------------------------------------------------

  -- <sample zip:either>
  let result = liftA2 (,) (Left "e1" :: Either String Int) (Left "e2" :: Either String Int)
  -- </sample>
  verify "zip:either" (Left "e1") result

  -- <sample zip:validation>
  let result = liftA2 (,) (Failure ["e1"] :: Validation [String] Int) (Failure ["e2"] :: Validation [String] Int)
  -- </sample>
  verify "zip:validation" (Failure ["e1", "e2"]) result

  -- <sample zip:list>
  let result = liftA2 (,) [1, 2, 3 :: Int] "ab"
  -- </sample>
  verify "zip:list" [(1, 'a'), (1, 'b'), (2, 'a'), (2, 'b'), (3, 'a'), (3, 'b')] result

  -- <sample zip:ziplist>
  let result = zipWith (\n s -> show n ++ [s]) [1, 2, 3 :: Int] "ab"
  -- </sample>
  verify "zip:ziplist" ["1a", "2b"] result

  -- --- Traversing -------------------------------------------------------------

  -- <sample traverse:either:short-circuit>
  let check x = if x < 0 then Left ("e" ++ show x) else Right (x * 10)
      result = traverse check [1, -2, 3, -4 :: Int]
  -- </sample>
  verify "traverse:either:short-circuit" (Left "e-2") result

  -- <sample traverse:option:short-circuit>
  let check x = if x < 0 then Nothing else Just (x * 10)
      result = traverse check [1, -2, 3 :: Int]
  -- </sample>
  verify "traverse:option:short-circuit" Nothing result

  -- <sample traverse:validation>
  let check x = if x < 0 then Failure ["e" ++ show x] else Success (x * 10)
      result = traverse check [1, -2, 3, -4 :: Int]
  -- </sample>
  verify "traverse:validation" (Failure ["e-2", "e-4"] :: Validation [String] [Int]) result

  -- <sample sequence:either:short-circuit>
  let result = sequenceA [Right 1, Left "e2", Left "e3"] :: Either String [Int]
  -- </sample>
  verify "sequence:either:short-circuit" (Left "e2") result

  -- <sample sequence:option:short-circuit>
  let result = sequenceA [Just 1, Nothing, Just (3 :: Int)]
  -- </sample>
  verify "sequence:option:short-circuit" Nothing result

  -- <sample sequence:validation>
  let result = sequenceA [Success 1, Failure ["e2"], Failure ["e3"]] :: Validation [String] [Int]
  -- </sample>
  verify "sequence:validation" (Failure ["e2", "e3"]) result

  -- --- Error handling ---------------------------------------------------------

  -- <sample mapError:either>
  let result = first length (Left "oops" :: Either String Int)
  -- </sample>
  verify "mapError:either" (Left 4) result

  -- <sample mapError:validation>
  let result = first (map length) (Failure ["ab", "abc"] :: Validation [String] Int)
  -- </sample>
  verify "mapError:validation" (Failure [2, 3]) result

  -- <sample recover:either>
  let result = either (Left . length) Right (Left "oops" :: Either String Int)
  -- </sample>
  verify "recover:either" (Left 4 :: Either Int Int) result

  -- <sample alt:option>
  let result = Nothing <|> Just (9 :: Int)
  -- </sample>
  verify "alt:option" (Just 9) result

  -- <sample alt:either>
  let result = (Left "e1" :: Either String Int) <!> Right 9
  -- </sample>
  verify "alt:either" (Right 9) result

  -- <sample alt:validation>
  let result = (Failure ["e1"] :: Validation [String] Int) <!> Failure ["e2"]
  -- </sample>
  verify "alt:validation" (Failure ["e1", "e2"]) result

  -- <sample alt:list>
  let result = [1, 2] <|> [3 :: Int]
  -- </sample>
  verify "alt:list" [1, 2, 3] result

  -- <sample getOrElse:either>
  let result = either length id (Left "oops" :: Either String Int)
  -- </sample>
  verify "getOrElse:either" 4 result

  -- <sample getOrElse:option>
  let result = fromMaybe 0 (Nothing :: Maybe Int)
  -- </sample>
  verify "getOrElse:option" 0 result

  -- --- Pattern matching -------------------------------------------------------

  -- <sample match:either>
  let result = either ("error " ++) (\x -> "value " ++ show x) (Left "oops" :: Either String Int)
  -- </sample>
  verify "match:either" "error oops" result

  -- <sample match:option>
  let result = maybe "nothing" (\x -> "value " ++ show x) (Just (2 :: Int))
  -- </sample>
  verify "match:option" "value 2" result

  -- <sample match:validation>
  let input = Failure ["e1", "e2"] :: Validation [String] Int
      result = case input of
        Failure es -> show (length es) ++ " errors"
        Success x -> "value " ++ show x
  -- </sample>
  verify "match:validation" "2 errors" result

  -- --- Filtering --------------------------------------------------------------

  -- <sample filter:list>
  let result = filter even [1, 2, 3, 4 :: Int]
  -- </sample>
  verify "filter:list" [2, 4] result

  -- <sample filter:option>
  let result = mfilter (> 5) (Just (3 :: Int))
  -- </sample>
  verify "filter:option" Nothing result

  -- <sample filterMap:list>
  let result = mapMaybe (\x -> if even x then Just (x * 10) else Nothing) [1, 2, 3, 4 :: Int]
  -- </sample>
  verify "filterMap:list" [20, 40] result

  -- <sample filterMap:option>
  let half x = if even x then Just (x `div` 2) else Nothing
      result = Just (4 :: Int) >>= half
  -- </sample>
  verify "filterMap:option" (Just 2) result

  -- <sample partition:list>
  let result = partition even [1, 2, 3, 4 :: Int]
  -- </sample>
  verify "partition:list" ([2, 4], [1, 3]) result

  -- <sample filterOrElse:either>
  let result = Right 3 >>= \x -> if x > 5 then Right x else Left ("too small: " ++ show (x :: Int))
  -- </sample>
  verify "filterOrElse:either" (Left "too small: 3") result

  n <- readIORef failures
  if n == 0 then putStrLn "ALL PASS" else do
    putStrLn (show n ++ " FAILED")
    exitFailure
