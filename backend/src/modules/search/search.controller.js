import {
  searchHospitalsService,
  getHospitalDetailService,
  searchDoctorsService,
} from './search.service.js';
import { successResponse } from '../../utils/apiResponse.js';

/**
 * GET /api/search/hospitals
 * Query params: city, lat, lng, radius, specialty, query
 */
export const getHospitals = async (req, res, next) => {
  try {
    const { city, lat, lng, radius, specialty, query } = req.query;

    const result = await searchHospitalsService({
      city: city ? String(city).trim() : undefined,
      lat: lat ? String(lat).trim() : undefined,
      lng: lng ? String(lng).trim() : undefined,
      radius: radius ? String(radius).trim() : undefined,
      specialty: specialty ? String(specialty).trim() : undefined,
      query: query ? String(query).trim() : undefined,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[SearchController] getHospitals error:', error);
    return res.status(500).json({
      success: false,
      message: "We couldn't retrieve healthcare information right now. Please try again.",
      error: 'SEARCH_OPERATION_FAILED',
    });
  }
};

/**
 * GET /api/search/hospitals/:placeId
 */
export const getHospitalDetail = async (req, res, next) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required',
      });
    }

    const result = await getHospitalDetailService(placeId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[SearchController] getHospitalDetail error:', error);
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: 'Hospital details not found.',
      });
    }
    return res.status(500).json({
      success: false,
      message: "We couldn't retrieve healthcare information right now. Please try again.",
      error: 'HOSPITAL_DETAIL_FAILED',
    });
  }
};

/**
 * GET /api/search/doctors
 * Query params: city, specialty, query, hospital
 */
export const getDoctors = async (req, res, next) => {
  try {
    const { city, specialty, query, hospital } = req.query;

    const result = await searchDoctorsService({
      city: city ? String(city).trim() : undefined,
      specialty: specialty ? String(specialty).trim() : undefined,
      query: query ? String(query).trim() : undefined,
      hospital: hospital ? String(hospital).trim() : undefined,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[SearchController] getDoctors error:', error);
    return res.status(500).json({
      success: false,
      message: "We couldn't retrieve doctor records right now. Please try again.",
      error: 'DOCTOR_SEARCH_FAILED',
    });
  }
};
