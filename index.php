<?php

class City {

    /** @var float */
    private $x;
    /** @var float */
    private $y;

    /**
     * constructs a city by coordinates and name
     *
     * @param float $x
     * @param float $y
     * @param string $name
     */
    public function __construct($x, $y, $name) {
        $this->x = $x;
        $this->y = $y;
        $this->name = $name;
    }

    /**
     * returns the name
     *
     * @return string
     */
    public function getName() {
        return $this->name;
    }

    /**
     * returns the x coordinate
     *
     * @return float
     */
    public function getX() {
        return $this->x;
    }

    /**
     * returns the y coordinate
     *
     * @return float
     */
    public function getY() {
        return $this->y;
    }

    /**
     * calculates a distance to another cities
     *
     * @param City $city
     * @return float
     */
    public function getDistanceTo(City $city) {
        return sqrt(
            pow(($this->getX() - $city->getX()), 2)
            +
            pow(($this->getY() - $city->getY()), 2)
        );
    }

}

class Solution {

    /** @var City[] */
    private $cities = array();

    /**
     * returns the cities of the solution
     *
     * @return array
     */
    public function getCities() {
        return $this->cities;
    }

    /**
     * constructor for the solution
     *
     * @param array $cities
     */
    public function __construct($cities) {
        $this->cities = $cities;
    }

    /**
     * generates one random solution
     *
     * @param array $cities
     * @return Solution
     */
    public static function generateRandom($cities){
        shuffle($cities);
        return new Solution($cities);
    }

    /**
     * calculates the length of a round trip
     *
     * @return float
     */
    public function getLength() {
        $length = 0;
        for ($i = 0; $i < count($this->cities); $i++) {
            if (isset($this->cities[$i + 1])){
                $length += $this->cities[$i]->getDistanceTo($this->cities[$i + 1]);
            } else {
                $length += $this->cities[$i]->getDistanceTo($this->cities[0]);
            }
        }
        return $length;
    }

    /**
     * checks if a city exists in the solution
     *
     * @param City $cityToSearch
     * @return bool
     */
    public function existsCityInSolution(City $cityToSearch) {
        foreach ($this->cities as $city) {
            if ($city->getX() == $cityToSearch->getX()
                && $city->getY() == $cityToSearch->getY()){
                return true;
            }
        }
        return false;
    }

    /**
     * creates a new solution by recombination of the parents' genes
     *
     * @param Solution $solution
     * @return Solution
     */
    public function getChildWith(Solution $solution) {
        $cities = array_slice($this->cities, 0, count($this->cities));
        foreach ($solution->cities as $city) {
            if (!$this->existsCityInSolution($city)) {
                $cities[] = $city;
            }
        }
        return new Solution($cities);
    }

    /**
     * mutates the current solution by
     * changing the order of two random cities
     */
    public function mutate() {
        $cityA = rand(0, count($this->cities) - 1);
        $cityB = rand(0, count($this->cities) - 1);

        $tempCity = $this->cities[$cityA];
        $this->cities[$cityA] = $this->cities[$cityB];
        $this->cities[$cityB] = $tempCity;
    }
}

class Population {

    /**
     * @var Solution[]
     */
    private $solutions = array();

    /**
     * performs a selection of the fittest solutions
     *
     * @param int $roundPopulationSize
     */
    public function doSelection($roundPopulationSize) {
        usort(
            $this->solutions,
            function(Solution $solutionA, Solution $solutionB){
                $lengthA = $solutionA->getLength();
                $lengthB = $solutionB->getLength();
                if ($lengthA == $lengthB) {
                    return 0;
                }
                return ($lengthA < $lengthB ? -1 : 1);
            }
        );
        $this->solutions = array_slice(
            $this->solutions,
            0,
            $roundPopulationSize
        );
    }

    /**
     * generates new population
     */
    public function doRecombination() {
        $children = array();
        for ($i = 0; $i < count($this->solutions); $i++) {
            for ($j = 0; $j < count($this->solutions); $j++) {
                if ($i != $j) {
                    $children[] = $this->solutions[$i]->getChildWith($this->solutions[$j]);
                }
            }
        }
        $this->solutions = $children;
    }

    /**
     * mutates solutions in the population with a given probability
     *
     * @param float $mutationProbability
     */
    public function doMutation($mutationProbability) {
        foreach ($this->solutions as $solution) {
            $random = mt_rand() / mt_getrandmax();
            if ($random < $mutationProbability) {
                $solution->mutate();
            }
        }
    }

    /**
     * generates the initial population
     *
     * @param City[] $cities
     * @param integer $initialPopulationSize
     */
    public function initializePopulation($cities, $initialPopulationSize) {
        for ($i = 0; $i < $initialPopulationSize; $i++) {
            $this->solutions[] = Solution::generateRandom($cities);
        }
    }

    /**
     * returns the best solution in the population
     *
     * @return Solution
     */
    public function getBestSolution() {
        return $this->solutions[0];
    }

}

// initialize cities
$cities = array(
    new City(1,  20, 'A'),
    new City(14, 3,  'B'),
    new City(3,  16, 'C'),
    new City(8,  3,  'D'),
    new City(10, 1,  'E'),
    new City(5,  4,  'F'),
);

// set variables
$initialPopulationSize = 50;
$roundPopulationSize = 10;
$mutationProbability = 0.2;
$maxEvolutionSteps = 100;

// initialization
$population = new Population();
$population->initializePopulation($cities, $initialPopulationSize);
$iEvolutionStep = 0;
do {
    // selection
    $population->doSelection($roundPopulationSize);
    // recombination
    $population->doRecombination();
    // mutation
    $population->doMutation($mutationProbability);
    // increase counter for evolution steps
    $iEvolutionStep++;
} while($iEvolutionStep < $maxEvolutionSteps);

$bestSolution = $population->getBestSolution();

echo 'Best found solution is "'
    . array_reduce(
        $bestSolution->getCities(),
        function($string, City $city) {
            $string .= ($string ? ', ' : '') . $city->getName();
            return $string;
        }
    )
    . '" with distance ' . $bestSolution->getLength();