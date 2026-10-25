-- Haskell samples shown on FP Shapes, for base 4.22.0.0 (GHC 9.14), mtl 2.3.2,
-- either 5.0.3 and semigroupoids 6.0.1. Code between "-- <sample KEY>" and
-- "-- </sample>" is shown on the site verbatim. Each sample binds `result`,
-- which the `verify` after it compares with the expected value.
-- Run: `npm run samples:haskell`. It exits non-zero if any check fails.
module Main (main) where

import Control.Applicative (ZipList (..), empty, (<|>))
import Control.Exception (SomeException, evaluate, try)
import Control.Monad (join, mfilter)
import Control.Monad.Except (catchError, throwError)
import Data.Bifunctor (bimap, first)
import Data.Char (toUpper)
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
  let result = Left "oops" :: Either String Int
  -- </sample>
  verify "fail:either" (Left "oops") result
  verify "fail:either throwError" result (throwError "oops")

  -- <sample fail:option>
  let result = Nothing :: Maybe Int
  -- </sample>
  verify "fail:option" Nothing result
  verify "fail:option empty" result empty

  -- <sample fail:validation>
  let result = Failure ["oops"] :: Validation [String] Int
  -- </sample>
  verify "fail:validation" (Failure ["oops"]) result

  -- <sample fail:list>
  let result = [] :: [Int]
  -- </sample>
  verify "fail:list" [] result
  verify "fail:list empty" result empty

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
  let input = 3 :: Int
      result = if input > 5 then Right input else Left ("too small: " ++ show input)
  -- </sample>
  verify "fromPredicate:either" (Left "too small: 3") result

  -- <sample fromPredicate:option>
  let result = mfilter (> 5) (Just (3 :: Int))
  -- </sample>
  verify "fromPredicate:option" Nothing result

  -- <sample fromPredicate:validation>
  let input = 3 :: Int
      result = if input > 5 then Success input else Failure ["too small: " ++ show input]
  -- </sample>
  verify "fromPredicate:validation" (Failure ["too small: 3"]) result

  -- <sample fromPredicate:list>
  let result = filter (> 5) [3 :: Int]
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
  let input = Right 2 :: Either String Int
      result = fmap (* 10) input
  -- </sample>
  verify "map:either" (Right 20) result

  -- <sample map:option>
  let input = Just 2 :: Maybe Int
      result = fmap (* 10) input
  -- </sample>
  verify "map:option" (Just 20) result

  -- <sample map:list>
  let input = [1, 2, 3] :: [Int]
      result = map (* 10) input
  -- </sample>
  verify "map:list" [10, 20, 30] result

  -- <sample bimap:either>
  let input = Left "oops" :: Either String Int
      result = bimap length (* 10) input
  -- </sample>
  verify "bimap:either" (Left 4) result

  -- <sample bimap:tuple>
  let input = ("oops", 2) :: (String, Int)
      result = bimap length (* 10) input
  -- </sample>
  verify "bimap:tuple" (4, 20) result

  -- --- Sequencing -------------------------------------------------------------

  -- <sample flatMap:either>
  let half x = if even x then Right (x `div` 2) else Left "odd"
      input = Right 4 :: Either String Int
      result = input >>= half
  -- </sample>
  verify "flatMap:either" (Right 2) result

  -- <sample flatMap:option>
  let half x = if even x then Just (x `div` 2) else Nothing
      input = Just 4 :: Maybe Int
      result = input >>= half
  -- </sample>
  verify "flatMap:option" (Just 2) result

  -- <sample flatMap:list>
  let input = [1, 2, 3] :: [Int]
      result = input >>= \x -> [x, x]
  -- </sample>
  verify "flatMap:list" [1, 1, 2, 2, 3, 3] result

  -- <sample flatten:either>
  let input = Right (Right 1) :: Either String (Either String Int)
      result = join input
  -- </sample>
  verify "flatten:either" (Right 1) result

  -- <sample flatten:option>
  let input = Just (Just 1) :: Maybe (Maybe Int)
      result = join input
  -- </sample>
  verify "flatten:option" (Just 1) result

  -- <sample flatten:list>
  let input = [[1, 2], [3]] :: [[Int]]
      result = concat input
  -- </sample>
  verify "flatten:list" [1, 2, 3] result
  verify "flatten:list join" result (join input)

  -- <sample tap:either>
  let audit x = if x > 0 then Right () else Left "audit failed"
      input = Right 2 :: Either String Int
      result = input >>= \x -> x <$ audit x
  -- </sample>
  verify "tap:either" (Right 2) result

  -- <sample tap:option>
  let audit x = if x > 0 then Just () else Nothing
      input = Just 2 :: Maybe Int
      result = input >>= \x -> x <$ audit x
  -- </sample>
  verify "tap:option" (Just 2) result

  -- <sample peek:either>
  let input = Right 2 :: Either String Int
      result = fmap traceShowId input
  -- </sample>
  verify "peek:either" (Right 2) result

  -- <sample peek:list>
  let input = [1, 2, 3] :: [Int]
      result = map traceShowId input
  -- </sample>
  verify "peek:list" [1, 2, 3] result

  -- --- Zipping ----------------------------------------------------------------

  -- <sample zip:either>
  let a = Left "e1" :: Either String Int
      b = Left "e2" :: Either String Int
      result = liftA2 (+) a b
  -- </sample>
  verify "zip:either" (Left "e1") result

  -- <sample zip:validation>
  let a = Failure ["e1"] :: Validation [String] Int
      b = Failure ["e2"] :: Validation [String] Int
      result = liftA2 (+) a b
  -- </sample>
  verify "zip:validation" (Failure ["e1", "e2"]) result

  -- <sample zip:list>
  let a = [1, 2, 3] :: [Int]
      b = ["a", "b"]
      result = liftA2 (\n s -> show n ++ s) a b
  -- </sample>
  verify "zip:list" ["1a", "1b", "2a", "2b", "3a", "3b"] result

  -- <sample zip:ziplist>
  let a = [1, 2, 3] :: [Int]
      b = ["a", "b"]
      result = zipWith (\n s -> show n ++ s) a b
  -- </sample>
  verify "zip:ziplist" ["1a", "2b"] result
  verify "zip:ziplist ZipList" result (getZipList (liftA2 (\n s -> show n ++ s) (ZipList a) (ZipList b)))

  -- --- Traversing -------------------------------------------------------------

  -- <sample traverse:either:short-circuit>
  let check x = if x < 0 then Left ("e" ++ show x) else Right (x * 10)
      input = [1, -2, 3, -4] :: [Int]
      result = traverse check input
  -- </sample>
  verify "traverse:either:short-circuit" (Left "e-2") result
  verify "traverse:either mapM" result (mapM check input)
  verify "traverse:either lazy" (Left "e-2") (traverse check (1 : -2 : error "forced after the first Left"))

  -- <sample traverse:option:short-circuit>
  let check x = if x < 0 then Nothing else Just (x * 10)
      input = [1, -2, 3, -4] :: [Int]
      result = traverse check input
  -- </sample>
  verify "traverse:option:short-circuit" Nothing result
  verify "traverse:option mapM" result (mapM check input)

  -- <sample traverse:validation>
  let check x = if x < 0 then Failure ["e" ++ show x] else Success (x * 10)
      input = [1, -2, 3, -4] :: [Int]
      result = traverse check input
  -- </sample>
  verify "traverse:validation" (Failure ["e-2", "e-4"] :: Validation [String] [Int]) result

  -- <sample sequence:either:short-circuit>
  let input = [Right 1, Left "e2", Right 3, Left "e4"] :: [Either String Int]
      result = sequenceA input
  -- </sample>
  verify "sequence:either:short-circuit" (Left "e2") result
  verify "sequence:either sequence" result (sequence input)

  -- <sample sequence:option:short-circuit>
  let input = [Just 1, Nothing, Just 3, Nothing] :: [Maybe Int]
      result = sequenceA input
  -- </sample>
  verify "sequence:option:short-circuit" Nothing result
  verify "sequence:option sequence" result (sequence input)

  -- <sample sequence:validation>
  let input = [Success 1, Failure ["e2"], Success 3, Failure ["e4"]] :: [Validation [String] Int]
      result = sequenceA input
  -- </sample>
  verify "sequence:validation" (Failure ["e2", "e4"]) result

  -- --- Error handling ---------------------------------------------------------

  -- <sample mapError:either>
  let input = Left "oops" :: Either String Int
      result = first length input
  -- </sample>
  verify "mapError:either" (Left 4) result

  -- <sample mapError:validation>
  let input = Failure ["e1", "e2"] :: Validation [String] Int
      result = first (map (map toUpper)) input
  -- </sample>
  verify "mapError:validation" (Failure ["E1", "E2"]) result

  -- <sample recover:either>
  let input = Left "oops" :: Either String Int
      result = either (Right . length) Right input
  -- </sample>
  verify "recover:either" (Right 4 :: Either String Int) result
  verify "recover:either catchError" result (catchError input (Right . length))

  -- <sample alt:option>
  let first = Nothing :: Maybe Int
      result = first <|> Just 9
  -- </sample>
  verify "alt:option" (Just 9) result

  -- <sample alt:either>
  let first = Left "e1" :: Either String Int
      result = first <!> Left "e2"
  -- </sample>
  verify "alt:either" (Left "e2") result

  -- <sample alt:validation>
  let first = Failure ["e1"] :: Validation [String] Int
      result = first <!> Failure ["e2"]
  -- </sample>
  verify "alt:validation" (Failure ["e1", "e2"]) result
  verify "alt:validation <|>" result (first <|> Failure ["e2"])

  -- <sample alt:list>
  let first = [1, 2] :: [Int]
      result = first ++ [3]
  -- </sample>
  verify "alt:list" [1, 2, 3] result
  verify "alt:list <|>" result (first <|> [3])

  -- <sample getOrElse:either>
  let input = Left "oops" :: Either String Int
      result = either length id input
  -- </sample>
  verify "getOrElse:either" 4 result

  -- <sample getOrElse:option>
  let input = Nothing :: Maybe Int
      result = fromMaybe 0 input
  -- </sample>
  verify "getOrElse:option" 0 result

  -- --- Pattern matching -------------------------------------------------------

  -- <sample match:either>
  let input = Left "oops" :: Either String Int
      result = either ("error " ++) (\x -> "value " ++ show x) input
  -- </sample>
  verify "match:either" "error oops" result

  -- <sample match:option>
  let input = Just 2 :: Maybe Int
      result = maybe "nothing" (\x -> "value " ++ show x) input
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
  let input = [1, 2, 3, 4] :: [Int]
      result = filter even input
  -- </sample>
  verify "filter:list" [2, 4] result

  -- <sample filter:option>
  let input = Just 3 :: Maybe Int
      result = mfilter (> 5) input
  -- </sample>
  verify "filter:option" Nothing result

  -- <sample filterMap:list>
  let input = [1, 2, 3, 4] :: [Int]
      result = mapMaybe (\x -> if even x then Just (x * 10) else Nothing) input
  -- </sample>
  verify "filterMap:list" [20, 40] result

  -- <sample filterMap:option>
  let half x = if even x then Just (x `div` 2) else Nothing
      input = Just 4 :: Maybe Int
      result = input >>= half
  -- </sample>
  verify "filterMap:option" (Just 2) result

  -- <sample partition:list>
  let input = [1, 2, 3, 4] :: [Int]
      result = partition even input
  -- </sample>
  verify "partition:list" ([2, 4], [1, 3]) result

  -- <sample filterOrElse:either>
  let input = Right 3 :: Either String Int
      result = input >>= \x -> if x > 5 then Right x else Left ("too small: " ++ show x)
  -- </sample>
  verify "filterOrElse:either" (Left "too small: 3") result

  n <- readIORef failures
  if n == 0 then putStrLn "ALL PASS" else do
    putStrLn (show n ++ " FAILED")
    exitFailure
