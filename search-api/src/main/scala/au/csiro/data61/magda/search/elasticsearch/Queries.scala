package au.csiro.data61.magda.search.elasticsearch

import java.time.OffsetDateTime

import org.apache.lucene.search.join.ScoreMode
import org.elasticsearch.common.geo.ShapeRelation
import com.sksamuel.elastic4s.ElasticDsl._
import com.sksamuel.elastic4s.searches.queries.NestedQueryDefinition
import com.typesafe.config.Config

import au.csiro.data61.magda.model.misc.QueryRegion
import au.csiro.data61.magda.spatial.RegionSource.generateRegionId
import com.sksamuel.elastic4s.searches.queries.geo.GeoShapeDefinition
import au.csiro.data61.magda.api.FilterValue
import com.sksamuel.elastic4s.searches.queries.QueryDefinition
import au.csiro.data61.magda.api.Specified
import au.csiro.data61.magda.api.Unspecified
import au.csiro.data61.magda.model.misc.Region
import au.csiro.data61.magda.search.SearchStrategy

object Queries {
  def publisherQuery(strategy: SearchStrategy)(publisher: FilterValue[String]) = {
    handleFilterValue(publisher, (publisherString: String) =>
      strategy match {
        case SearchStrategy.MatchAll  => matchPhraseQuery("publisher.name", publisherString)
        case SearchStrategy.MatchPart => multiMatchQuery(publisherString).fields(Seq("publisher.name", "publisher.name.english"))
      }, "publisher.name"
    )
  }

  def exactPublisherQuery(publisher: FilterValue[String]) = publisherQuery(SearchStrategy.MatchAll)(publisher)
  def baseFormatQuery(strategy: SearchStrategy, formatString: String) = nestedQuery("distributions")
    .query(strategy match {
      case SearchStrategy.MatchAll  => matchPhraseQuery("distributions.format", formatString)
      case SearchStrategy.MatchPart => multiMatchQuery(formatString).fields(Seq("distributions.format", "distributions.format.english"))
    })
    .scoreMode(ScoreMode.Avg)
  def formatQuery(strategy: SearchStrategy)(formatValue: FilterValue[String]): QueryDefinition = {
    formatValue match {
      case Specified(inner) => baseFormatQuery(strategy, inner)
      case Unspecified()    => nestedQuery("distributions").query(boolQuery().not(existsQuery("distributions.format"))).scoreMode(ScoreMode.Avg)
    }
  }

  def regionIdQuery(regionValue: FilterValue[Region], indices: Indices)(implicit config: Config) = {
    def normal(region: Region) = geoShapeQuery("spatial.geoJson", generateRegionId(region.queryRegion.regionType, region.queryRegion.regionId), indices.getType(Indices.RegionsIndexType))
      .relation(ShapeRelation.INTERSECTS)
      .indexedShapeIndex(indices.getIndex(config, Indices.RegionsIndex))
      .indexedShapePath("geometry")

    handleFilterValue(regionValue, normal, "spatial.geoJson")
  }
  def dateQueries(dateFrom: Option[FilterValue[OffsetDateTime]], dateTo: Option[FilterValue[OffsetDateTime]]) = {
    Seq(
      (dateFrom, dateTo) match {
        case (Some(Unspecified()), Some(Unspecified())) |
          (Some(Unspecified()), None) |
          (None, Some(Unspecified())) => Some(Queries.dateUnspecifiedQuery)
        case _ => None
      },
      dateFrom.flatMap(_.map(dateFromQuery)),
      dateTo.flatMap(_.map(dateToQuery))
    ).flatten
  }

  def dateFromQuery(dateFrom: OffsetDateTime) = {
    filter(should(
      rangeQuery("temporal.end.date").gte(dateFrom.toString),
      rangeQuery("temporal.start.date").gte(dateFrom.toString)).minimumShouldMatch(1))
  }
  def dateToQuery(dateTo: OffsetDateTime) = {
    filter(should(
      rangeQuery("temporal.end.date").lte(dateTo.toString),
      rangeQuery("temporal.start.date").lte(dateTo.toString)).minimumShouldMatch(1))
  }
  val dateUnspecifiedQuery = boolQuery().not(existsQuery("temporal.end.date"), existsQuery("temporal.start.date"))

  def exactDateQuery(dateFrom: OffsetDateTime, dateTo: OffsetDateTime) = must(dateFromQuery(dateFrom), dateToQuery(dateTo))

  def handleFilterValue[T](filterValue: FilterValue[T], converter: T => QueryDefinition, field: String) = filterValue match {
    case Specified(inner) => converter(inner)
    case Unspecified()    => boolQuery().not(existsQuery(field))
  }
}

